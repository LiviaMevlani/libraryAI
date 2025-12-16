# services/book_service.py
from typing import List, Optional
from models import Book, User
from repositories.book_repo import (
    get_books_for_user,
    get_all_books,
    get_book_by_id,
    create_book,
    delete_book,
    update_book,
)


class BookError(Exception):
    pass


# Allowed reading statuses for validation
ALLOWED_STATUSES = {"planned", "reading", "completed"}


# -----------------------------------------------------------------------------
# LISTING
# -----------------------------------------------------------------------------

def _filter_books(books: List[Book], genre: str = None, status: str = None) -> List[Book]:
    """Helper to filter by genre and reading_status."""
    if genre:
        genre = genre.strip().lower()
        if genre:  # Only filter if genre is not empty after stripping
            books = [b for b in books if b.genre and (b.genre.lower() == genre)]

    if status:
        status = status.strip().lower()
        if status and status in ALLOWED_STATUSES:
            books = [
                b for b in books
                if b.reading_status and (b.reading_status.lower() == status)
            ]
    return books


def list_books_for_user(user: User, genre: str = None, status: str = None) -> List[Book]:
    """
    If admin -> list ALL books
    If normal user -> list only their books
    Optional filtering by genre & status for both.
    """
    if user.is_admin:
        books = get_all_books()
    else:
        books = get_books_for_user(user.id)

    return _filter_books(books, genre=genre, status=status)


def list_books_for_admin(genre: str = None, status: str = None) -> List[Book]:
    """
    Admin-only listing. Used explicitly by admin routes if you want.
    """
    books = get_all_books()
    return _filter_books(books, genre=genre, status=status)




# -----------------------------------------------------------------------------
# CREATE
# -----------------------------------------------------------------------------

def create_book_for_user(user: User, data: dict) -> Book:
    """
    Validates and creates a book for the given user.
    """
    title = (data.get("title") or "").strip()
    if not title:
        raise BookError("Title is required.")

    genre = (data.get("genre") or "").strip()
    reading_status = (data.get("reading_status") or "planned").strip().lower()
    price = data.get("price")
    pages = data.get("pages")

    # Validate reading status
    if reading_status not in ALLOWED_STATUSES:
        raise BookError(
            "Invalid reading status. Allowed values: planned, reading, completed."
        )

    # Validate price
    if price is not None:
        try:
            price = float(price)
        except ValueError:
            raise BookError("Price must be a number.")

    # Validate pages
    if pages is not None:
        try:
            pages = int(pages)
        except ValueError:
            raise BookError("Pages must be an integer.")

    # Create book
    return create_book(
        user_id=user.id,
        title=title,
        author=data.get("author"),
        genre=genre,
        price=price,
        pages=pages,
        reading_status=reading_status,
    )


# -----------------------------------------------------------------------------
# UPDATE
# -----------------------------------------------------------------------------

def update_book_for_user(user: User, book_id: int, data: dict) -> Book:
    """
    Updates a book. Only owner or admin can edit.
    """
    book = get_book_by_id(book_id)
    if not book:
        raise BookError("Book not found.")

    if book.user_id != user.id and not user.is_admin:
        raise BookError("Not authorized to edit this book.")

    # Extract values
    title = data.get("title")
    author = data.get("author")
    genre = data.get("genre")
    price = data.get("price")
    pages = data.get("pages")
    reading_status = data.get("reading_status")

    # Optional validations
    if reading_status:
        reading_status = reading_status.lower()
        if reading_status not in ALLOWED_STATUSES:
            raise BookError(
                "Invalid reading status. Allowed values: planned, reading, completed."
            )

    if price is not None:
        try:
            price = float(price)
        except ValueError:
            raise BookError("Price must be numeric.")

    if pages is not None:
        try:
            pages = int(pages)
        except ValueError:
            raise BookError("Pages must be an integer.")

    # Commit update
    return update_book(
        book,
        title=title,
        author=author,
        genre=genre,
        price=price,
        pages=pages,
        reading_status=reading_status,
    )


# -----------------------------------------------------------------------------
# DELETE
# -----------------------------------------------------------------------------

def delete_book_for_user(user: User, book_id: int) -> None:
    """
    Deletes a book. Only owner or admin can delete.
    """
    book = get_book_by_id(book_id)
    if not book:
        raise BookError("Book not found.")

    if book.user_id != user.id and not user.is_admin:
        raise BookError("Not authorized to delete this book.")

    delete_book(book)

