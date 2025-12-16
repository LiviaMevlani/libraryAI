import pytest
from models import Book
from services.book_service import create_book_for_user, delete_book_for_user


def test_create_book(app, regular_user):
    with app.app_context():
        book = create_book_for_user(
            regular_user,
            {
                "title": "Test Book",
                "author": "Test Author",
                "genre": "Fiction",
                "reading_status": "planned",
            },
        )
        assert book.title == "Test Book"
        assert book.user_id == regular_user.id


def test_delete_book(app, regular_user):
    with app.app_context():
        book = create_book_for_user(regular_user, {"title": "Test Book"})
        delete_book_for_user(regular_user, book.id)
        assert Book.query.get(book.id) is None
