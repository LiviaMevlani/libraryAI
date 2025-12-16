import pytest
from extensions import db
from models import User, Book
from services.auth_service import register_user
from services.ai_service import (
    handle_ai_query,
    AIError,
    get_recommendations,
    get_insights,
    _sanitize_input,
    _parse_intent,
)

@pytest.fixture
def test_books(app, regular_user_id, admin_user_id):
    with app.app_context():
        # Add books for regular user
        book1 = Book(
            title="Test Book 1",
            author="Author 1",
            genre="Fantasy",
            price=10.50,
            pages=300,
            reading_status="completed",
            user_id=regular_user_id,
        )
        book2 = Book(
            title="Test Book 2",
            author="Author 2",
            genre="Sci-Fi",
            price=15.00,
            pages=250,
            reading_status="reading",
            user_id=regular_user_id,
        )
        # Add book for admin
        book3 = Book(
            title="Admin Book",
            author="Admin Author",
            genre="Fantasy",
            price=20.00,
            pages=400,
            reading_status="planned",
            user_id=admin_user_id,
        )
        db.session.add_all([book1, book2, book3])
        db.session.commit()

        # Return IDs (safer than returning ORM objects)
        return [book1.id, book2.id, book3.id]



def test_sanitize_input(app):
    """Test input sanitization."""
    with app.app_context():
        # Test normal input
        assert _sanitize_input("Who owns the most books?") == "Who owns the most books?"
        
        # Test SQL injection attempt
        assert "'; DROP TABLE" not in _sanitize_input("'; DROP TABLE books; --")
        
        # Test XSS attempt
        assert "<script>" not in _sanitize_input("<script>alert('xss')</script>")
        
        # Test length limit
        long_input = "a" * 600
        assert len(_sanitize_input(long_input)) <= 500


def test_parse_intent_valid_queries(app):
    """Test intent parsing for valid queries."""
    with app.app_context():
        assert _parse_intent("Who owns the most books?") == "owner_with_most_books"
        assert _parse_intent("Which is the most popular book?") == "most_popular_book"
        assert _parse_intent("Show the five most expensive books") == "five_most_expensive_books"
        assert _parse_intent("5 most expensive") == "five_most_expensive_books"


def test_parse_intent_malicious_inputs(app):
    """Test intent parsing rejects malicious inputs."""
    with app.app_context():
        # SQL injection attempts
        assert _parse_intent("'; DROP TABLE books; --") is None
        assert _parse_intent("1' OR '1'='1") is None
        
        # XSS attempts
        assert _parse_intent("<script>alert('xss')</script>") is None
        
        # Invalid queries
        assert _parse_intent("DELETE FROM books") is None
        assert _parse_intent("SELECT * FROM users") is None


def test_ai_query_authorization(app, regular_user, admin_user, test_books):
    """Test that users only see their own data."""
    with app.app_context():
        # Regular user query
        result = handle_ai_query("Who owns the most books?", regular_user)
        assert result["type"] == "owner_with_most_books"
        assert result["scope"] == "your_books"
        assert result["user"]["id"] == regular_user.id
        
        # Admin query (sees all)
        result = handle_ai_query("Who owns the most books?", admin_user)
        assert result["type"] == "owner_with_most_books"
        assert result["scope"] == "all_users"


def test_ai_query_malicious_prompts(app, regular_user):
    """Test handling of malicious prompts."""
    with app.app_context():
        # SQL injection
        with pytest.raises(AIError):
            handle_ai_query("'; DROP TABLE books; --", regular_user)
        
        # XSS
        with pytest.raises(AIError):
            handle_ai_query("<script>alert('xss')</script>", regular_user)
        
        # Command injection
        with pytest.raises(AIError):
            handle_ai_query("| rm -rf /", regular_user)
        
        # Empty/too short
        with pytest.raises(AIError):
            handle_ai_query("", regular_user)
        with pytest.raises(AIError):
            handle_ai_query("ab", regular_user)


def test_recommendations_user_scope(app, regular_user, admin_user, test_books):
    """Test recommendations respect user scope."""
    with app.app_context():
        result = get_recommendations(regular_user)
        assert result["type"] == "recommendations"
        # Should not recommend user's own books
        if result.get("books"):
            for book in result["books"]:
                # Verify we can't access user_id directly, but check via query
                book_obj = Book.query.get(book["id"])
                assert book_obj.user_id != regular_user.id


def test_insights_user_scope(app, regular_user, test_books):
    """Test insights only show user's own data."""
    with app.app_context():
        result = get_insights(regular_user)
        assert result["type"] == "insights"
        assert result["total_books"] == 2  # Only regular_user's books
        assert "Fantasy" in result["user_genre_distribution"]
        assert result["user_genre_distribution"]["Fantasy"] == 1


def test_ai_query_invalid_intent(app, regular_user):
    """Test that invalid intents are rejected."""
    with app.app_context():
        with pytest.raises(AIError):
            handle_ai_query("DELETE FROM books", regular_user)
        with pytest.raises(AIError):
            handle_ai_query("What is the weather?", regular_user)


def test_insights_summary_generation(app, regular_user, test_books):
    """Test that insights include AI-generated summary."""
    with app.app_context():
        result = get_insights(regular_user)
        assert result["type"] == "insights"
        assert "summary" in result
        assert isinstance(result["summary"], str)
        assert len(result["summary"]) > 0
        # Summary should mention book count
        assert str(result["total_books"]) in result["summary"]


def test_insights_comprehensive_data(app, regular_user, test_books):
    """Test that insights include all expected fields."""
    with app.app_context():
        result = get_insights(regular_user)
        assert "total_books" in result
        assert "user_genre_distribution" in result
        assert "status_distribution" in result
        assert "favorite_genre" in result
        assert "summary" in result
        # Optional fields
        if result.get("average_pages"):
            assert "min_pages" in result
            assert "max_pages" in result
            assert "total_pages" in result


def test_recommendations_reason_field(app, regular_user, admin_user, test_books):
    """Test that recommendations include explanation reason."""
    with app.app_context():
        result = get_recommendations(regular_user)
        assert result["type"] == "recommendations"
        assert "reason" in result
        assert isinstance(result["reason"], str)
        assert len(result["reason"]) > 0


def test_ai_query_table_formatting(app, regular_user, test_books):
    """Test that expensive books query returns data suitable for table display."""
    with app.app_context():
        result = handle_ai_query("Show the five most expensive books", regular_user)
        assert result["type"] == "five_most_expensive_books"
        assert "books" in result
        assert isinstance(result["books"], list)
        # Each book should have required fields for table
        for book in result["books"]:
            assert "title" in book
            assert "author" in book
            assert "genre" in book
            assert "price" in book


def test_parse_intent_enhanced_patterns(app):
    """Test enhanced intent patterns."""
    with app.app_context():
        # Test new variations
        assert _parse_intent("biggest book collector") == "owner_with_most_books"
        assert _parse_intent("most read book") == "most_popular_book"
        assert _parse_intent("top 5 expensive") == "five_most_expensive_books"
        assert _parse_intent("costliest books") == "five_most_expensive_books"
