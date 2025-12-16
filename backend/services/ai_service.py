# services/ai_service.py
from typing import Dict, Any, List, Optional
from sqlalchemy import func
import re

from extensions import db
from models import User, Book


class AIError(Exception):
    pass


# Allowed query intents (security: only these are allowed)
ALLOWED_INTENTS = {
    "owner_with_most_books",
    "most_popular_book",
    "five_most_expensive_books",
}


def _sanitize_input(text: str, max_length: int = 500) -> str:
    """Sanitize user input to prevent injection attacks."""
    if not text:
        return ""
    # Remove potentially dangerous characters, limit length
    sanitized = re.sub(r'[<>"\';\\]', '', text[:max_length])
    return sanitized.strip()


def _parse_intent(question: str) -> Optional[str]:
    """
    Parse natural language question into structured intent.
    Returns intent type or None if not recognized.
    """
    if not question:
        return None
    
    q = _sanitize_input(question).lower()
    q = " ".join(q.split())  # Normalize whitespace
    
    # Intent: owner_with_most_books (enhanced patterns)
    if any(phrase in q for phrase in [
        "who owns the most books",
        "who has the most books",
        "which user has the most books",
        "top book owner",
        "biggest book collector",
        "user with most books",
    ]) or (("most" in q or "top" in q or "biggest" in q) and "books" in q and 
           ("own" in q or "has" in q or "collect" in q or "user" in q)):
        return "owner_with_most_books"
    
    # Intent: most_popular_book (enhanced patterns)
    if any(phrase in q for phrase in [
        "most popular book",
        "which is the most popular book",
        "what is the most popular book",
        "popular book",
        "most read book",
        "top book",
        "favorite book",
    ]) or (("popular" in q or "most read" in q or "favorite" in q) and "book" in q):
        return "most_popular_book"
    
    # Intent: five_most_expensive_books (enhanced patterns)
    if any(phrase in q for phrase in [
        "five most expensive",
        "5 most expensive",
        "most expensive books",
        "top expensive books",
        "highest priced books",
        "costliest books",
        "top 5 expensive",
    ]) or (("expensive" in q or "price" in q or "cost" in q) and 
           ("most" in q or "top" in q or "highest" in q) and "book" in q):
        return "five_most_expensive_books"
    
    return None


def _owner_with_most_books(user: User) -> Dict[str, Any]:
    """
    Returns the user who owns the most books and their count.
    Admin sees all users; regular users see only themselves.
    """
    if user.is_admin:
        # Admin: see all users
        result = (
            db.session.query(User, func.count(Book.id).label("book_count"))
            .join(Book, Book.user_id == User.id)
            .group_by(User.id)
            .order_by(func.count(Book.id).desc())
            .first()
        )
    else:
        # Regular user: only see their own stats
        result = (
            db.session.query(User, func.count(Book.id).label("book_count"))
            .join(Book, Book.user_id == User.id)
            .filter(User.id == user.id)
            .group_by(User.id)
            .first()
        )
    
    if not result:
        raise AIError("No books found.")
    
    user_obj, count = result
    return {
        "type": "owner_with_most_books",
        "user": {
            "id": user_obj.id,
            "name": user_obj.name,
            "email": user_obj.email,
        },
        "book_count": int(count),
        "scope": "all_users" if user.is_admin else "your_books",
    }


def _most_popular_book(user: User) -> Dict[str, Any]:
    """
    Returns the most popular book.
    Admin sees all books; regular users see only their books.
    """
    if user.is_admin:
        # Admin: see all books
        result = (
            db.session.query(Book.title, func.count(Book.id).label("count"))
            .group_by(Book.title)
            .order_by(func.count(Book.id).desc())
            .first()
        )
    else:
        # Regular user: only their books
        result = (
            db.session.query(Book.title, func.count(Book.id).label("count"))
            .filter(Book.user_id == user.id)
            .group_by(Book.title)
            .order_by(func.count(Book.id).desc())
            .first()
        )
    
    if not result:
        raise AIError("No books found.")
    
    title, count = result
    # Fetch example book (respecting user scope)
    if user.is_admin:
        sample_book = Book.query.filter_by(title=title).first()
    else:
        sample_book = Book.query.filter_by(title=title, user_id=user.id).first()
    
    return {
        "type": "most_popular_book",
        "title": title,
        "count": int(count),
        "example": {
            "author": sample_book.author if sample_book else None,
            "genre": sample_book.genre if sample_book else None,
        },
        "scope": "all_books" if user.is_admin else "your_books",
    }


def _five_most_expensive_books(user: User) -> Dict[str, Any]:
    """
    Returns the five most expensive books.
    Admin sees all books; regular users see only their books.
    """
    if user.is_admin:
        # Admin: see all books
        books: List[Book] = (
            Book.query.filter(Book.price.isnot(None))
            .order_by(Book.price.desc())
            .limit(5)
            .all()
        )
    else:
        # Regular user: only their books
        books: List[Book] = (
            Book.query.filter(Book.price.isnot(None))
            .filter(Book.user_id == user.id)
            .order_by(Book.price.desc())
            .limit(5)
            .all()
        )
    
    if not books:
        raise AIError("No books with price information found.")
    
    return {
        "type": "five_most_expensive_books",
        "books": [
            {
                "id": b.id,
                "title": b.title,
                "author": b.author,
                "genre": b.genre,
                "price": float(b.price) if b.price is not None else None,
                "owner_id": b.user_id,
            }
            for b in books
        ],
        "scope": "all_books" if user.is_admin else "your_books",
    }


def handle_ai_query(question: str, user: User) -> Dict[str, Any]:
    """
    Secure AI query handler with structured intent parsing.
    NL → Intent → Allow-listed SQLAlchemy queries.
    """
    if not question:
        raise AIError("Question is required.")
    
    # Sanitize input
    question = _sanitize_input(question)
    if len(question) < 3:
        raise AIError("Question is too short.")
    if len(question) > 500:
        raise AIError("Question is too long (max 500 characters).")
    
    # Parse intent (NL → structured intent)
    intent = _parse_intent(question)
    
    if not intent:
        raise AIError(
            "I don't understand this question. "
            "Try: 'Who owns the most books?', "
            "'Which is the most popular book?', or "
            "'Show the five most expensive books.'"
        )
    
    # Validate intent is in allow-list (security check)
    if intent not in ALLOWED_INTENTS:
        raise AIError("Invalid query intent.")
    
    # Execute allow-listed query based on intent
    try:
        if intent == "owner_with_most_books":
            return _owner_with_most_books(user)
        elif intent == "most_popular_book":
            return _most_popular_book(user)
        elif intent == "five_most_expensive_books":
            return _five_most_expensive_books(user)
        else:
            raise AIError("Unsupported query intent.")
    except AIError:
        raise
    except Exception as e:
        # Don't expose internal errors
        raise AIError("An error occurred processing your query.")


def get_recommendations(user: User) -> Dict[str, Any]:
    """
    Lightweight genre-based recommendations with collaborative filtering.
    """
    try:
        # Get user's most read genre
        user_genre = (
            db.session.query(Book.genre, func.count(Book.id).label("count"))
            .filter_by(user_id=user.id)
            .filter(Book.genre.isnot(None))
            .group_by(Book.genre)
            .order_by(func.count(Book.id).desc())
            .first()
        )
        
        if not user_genre:
            # Fallback: use most popular genre overall
            all_genre_stats = (
                db.session.query(Book.genre, func.count(Book.id).label("count"))
                .filter(Book.genre.isnot(None))
                .group_by(Book.genre)
                .order_by(func.count(Book.id).desc())
                .first()
            )
            
            if not all_genre_stats:
                return {
                    "type": "recommendations",
                    "message": "No books in the library yet. Add some books to get recommendations!",
                    "books": [],
                }
            
            # Get books from most popular genre (excluding user's own)
            recommended = (
                Book.query.filter(Book.genre == all_genre_stats[0])
                .filter(Book.user_id != user.id)
                .limit(5)
                .all()
            )
            
            return {
                "type": "recommendations",
                "based_on_genre": all_genre_stats[0],
                "strategy": "most_popular_genre",
                "reason": f"Based on the most popular genre in the library: {all_genre_stats[0]}",
                "books": [
                    {
                        "id": b.id,
                        "title": b.title,
                        "author": b.author,
                        "genre": b.genre,
                        "price": float(b.price) if b.price else None,
                    }
                    for b in recommended
                ],
            }
        
        # Find books in same genre from other users (collaborative filtering)
        recommended = (
            Book.query.filter(Book.genre == user_genre[0])
            .filter(Book.user_id != user.id)
            .limit(5)
            .all()
        )
        
        # If not enough, supplement with other popular books
        if len(recommended) < 3:
            additional = (
                Book.query.filter(Book.user_id != user.id)
                .filter(~Book.id.in_([b.id for b in recommended]) if recommended else True)
                .order_by(Book.created_at.desc())
                .limit(5 - len(recommended))
                .all()
            )
            recommended.extend(additional)
        
        return {
            "type": "recommendations",
            "based_on_genre": user_genre[0],
            "strategy": "user_preference",
            "reason": f"Based on your preference for {user_genre[0]} genre",
            "books": [
                {
                    "id": b.id,
                    "title": b.title,
                    "author": b.author,
                    "genre": b.genre,
                    "price": float(b.price) if b.price else None,
                }
                for b in recommended[:5]
            ],
        }
    except Exception as e:
        raise AIError(f"Error generating recommendations: {str(e)}")


def _generate_reading_summary(user: User, insights: Dict[str, Any]) -> str:
    """
    Generate a natural language summary of user's reading habits.
    """
    total = insights.get("total_books", 0)
    if total == 0:
        return "You haven't added any books to your library yet."
    
    avg_pages = insights.get("average_pages")
    genre_dist = insights.get("user_genre_distribution", {})
    status_dist = insights.get("status_distribution", {})
    
    parts = []
    
    # Book count summary
    parts.append(f"You have {total} book{'s' if total != 1 else ''} in your library.")
    
    # Genre preference
    if genre_dist:
        favorite_genre = max(genre_dist.items(), key=lambda x: x[1])
        parts.append(f"Your favorite genre is {favorite_genre[0]} ({favorite_genre[1]} books).")
    
    # Reading status
    if status_dist:
        completed = status_dist.get("completed", 0)
        reading = status_dist.get("reading", 0)
        if completed > 0:
            parts.append(f"You've completed {completed} book{'s' if completed != 1 else ''}.")
        if reading > 0:
            parts.append(f"You're currently reading {reading} book{'s' if reading != 1 else ''}.")
    
    # Page length preference
    if avg_pages:
        if avg_pages < 200:
            parts.append("You tend to read shorter books (under 200 pages).")
        elif avg_pages > 400:
            parts.append("You prefer longer books (over 400 pages).")
        else:
            parts.append("You read books of average length (200-400 pages).")
    
    return " ".join(parts)


def get_insights(user: User) -> Dict[str, Any]:
    """Generate comprehensive insights about reading habits with summaries."""
    try:
        # Genre distribution (user's books only)
        genre_stats = (
            db.session.query(Book.genre, func.count(Book.id).label("count"))
            .filter_by(user_id=user.id)
            .filter(Book.genre.isnot(None))
            .group_by(Book.genre)
            .all()
        )
        
        # Status distribution
        status_stats = (
            db.session.query(Book.reading_status, func.count(Book.id).label("count"))
            .filter_by(user_id=user.id)
            .filter(Book.reading_status.isnot(None))
            .group_by(Book.reading_status)
            .all()
        )
        
        # Average pages
        avg_pages = (
            db.session.query(func.avg(Book.pages))
            .filter_by(user_id=user.id)
            .filter(Book.pages.isnot(None))
            .scalar()
        )
        
        # Min/Max pages
        min_pages = (
            db.session.query(func.min(Book.pages))
            .filter_by(user_id=user.id)
            .filter(Book.pages.isnot(None))
            .scalar()
        )
        max_pages = (
            db.session.query(func.max(Book.pages))
            .filter_by(user_id=user.id)
            .filter(Book.pages.isnot(None))
            .scalar()
        )
        
        # Total pages read
        total_pages = (
            db.session.query(func.sum(Book.pages))
            .filter_by(user_id=user.id)
            .filter(Book.pages.isnot(None))
            .scalar()
        )
        
        # Average price
        avg_price = (
            db.session.query(func.avg(Book.price))
            .filter_by(user_id=user.id)
            .filter(Book.price.isnot(None))
            .scalar()
        )
        
        # Most popular genre across all users (for context)
        all_genre_stats = (
            db.session.query(Book.genre, func.count(Book.id).label("count"))
            .filter(Book.genre.isnot(None))
            .group_by(Book.genre)
            .order_by(func.count(Book.id).desc())
            .first()
        )
        
        # Favorite genre (user's most read)
        favorite_genre = None
        if genre_stats:
            favorite_genre = max(genre_stats, key=lambda x: x[1])[0]
        
        insights_data = {
            "type": "insights",
            "user_genre_distribution": {g: int(c) for g, c in genre_stats},
            "status_distribution": {s: int(c) for s, c in status_stats},
            "average_pages": float(avg_pages) if avg_pages else None,
            "min_pages": int(min_pages) if min_pages else None,
            "max_pages": int(max_pages) if max_pages else None,
            "total_pages": int(total_pages) if total_pages else None,
            "average_price": float(avg_price) if avg_price else None,
            "total_books": Book.query.filter_by(user_id=user.id).count(),
            "favorite_genre": favorite_genre,
            "most_popular_genre_overall": all_genre_stats[0] if all_genre_stats else None,
        }
        
        # Generate AI summary
        insights_data["summary"] = _generate_reading_summary(user, insights_data)
        
        return insights_data
    except Exception as e:
        raise AIError(f"Error generating insights: {str(e)}")
