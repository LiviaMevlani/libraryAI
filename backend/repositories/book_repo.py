# repositories/book_repo.py
from typing import List, Optional
from extensions import db
from models import Book


def get_books_for_user(user_id: int) -> List[Book]:
    return Book.query.filter_by(user_id=user_id).order_by(Book.created_at.desc()).all()


def get_all_books() -> List[Book]:
    return Book.query.order_by(Book.created_at.desc()).all()


def get_book_by_id(book_id: int) -> Optional[Book]:
    return Book.query.get(book_id)


def create_book(
    user_id: int,
    title: str,
    author: str = None,
    genre: str = None,
    price: float = None,
    pages: int = None,
    reading_status: str = "planned",
) -> Book:
    book = Book(
        user_id=user_id,
        title=title,
        author=author,
        genre=genre,
        price=price,
        pages=pages,
        reading_status=reading_status,
    )
    db.session.add(book)
    db.session.commit()
    return book


def delete_book(book: Book) -> None:
    db.session.delete(book)
    db.session.commit()


def update_book(
    book: Book,
    *,
    title: str = None,
    author: str = None,
    genre: str = None,
    price: float = None,
    pages: int = None,
    reading_status: str = None,
) -> Book:
    if title is not None:
        book.title = title
    if author is not None:
        book.author = author
    if genre is not None:
        book.genre = genre
    if price is not None:
        book.price = price
    if pages is not None:
        book.pages = pages
    if reading_status is not None:
        book.reading_status = reading_status

    db.session.commit()
    return book
