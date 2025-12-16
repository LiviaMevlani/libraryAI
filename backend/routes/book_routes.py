# routes/book_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from services.auth_service import get_user_or_raise
from services.book_service import (
    list_books_for_user,
    list_books_for_admin,
    create_book_for_user,
    update_book_for_user,
    delete_book_for_user,
    BookError,
)

book_bp = Blueprint("books", __name__)


def serialize_book(b):
    return {
        "id": b.id,
        "title": b.title,
        "author": b.author,
        "genre": b.genre,
        "price": float(b.price) if b.price is not None else None,
        "pages": b.pages,
        "reading_status": b.reading_status,
        "user_id": b.user_id,
    }


# -----------------------------------------------------------
# LIST BOOKS
# -----------------------------------------------------------


@book_bp.get("/")
@jwt_required()
def list_books():
    current_user_id = int(get_jwt_identity())
    user = get_user_or_raise(current_user_id)

    # Optional filters from query params: ?genre=Fantasy&status=reading
    genre = request.args.get("genre")
    status = request.args.get("status")

    books = list_books_for_user(user, genre=genre, status=status)

    result = []
    for b in books:
        result.append(
            {
                "id": b.id,
                "title": b.title,
                "author": b.author,
                "genre": b.genre,
                "price": float(b.price) if b.price is not None else None,
                "pages": b.pages,
                "reading_status": b.reading_status,
                "user_id": b.user_id,
            }
        )

    return jsonify(result), 200


# -----------------------------------------------------------
# CREATE BOOK
# -----------------------------------------------------------
@book_bp.post("/")
@jwt_required()
def create_book_route():
    current_user_id = int(get_jwt_identity())
    user = get_user_or_raise(current_user_id)

    data = request.get_json() or {}

    try:
        book = create_book_for_user(user, data)
    except BookError as e:
        return jsonify({"message": str(e)}), 400

    return jsonify(serialize_book(book)), 201


# -----------------------------------------------------------
# UPDATE BOOK
# -----------------------------------------------------------
@book_bp.put("/<int:book_id>")
@jwt_required()
def update_book_route(book_id: int):
    current_user_id = int(get_jwt_identity())
    user = get_user_or_raise(current_user_id)
    data = request.get_json() or {}

    try:
        book = update_book_for_user(user, book_id, data)
    except BookError as e:
        return jsonify({"message": str(e)}), 400

    return jsonify(serialize_book(book)), 200


# -----------------------------------------------------------
# DELETE BOOK
# -----------------------------------------------------------
@book_bp.delete("/<int:book_id>")
@jwt_required()
def delete_book_route(book_id: int):
    current_user_id = int(get_jwt_identity())
    user = get_user_or_raise(current_user_id)

    try:
        delete_book_for_user(user, book_id)
    except BookError as e:
        return jsonify({"message": str(e)}), 400

    return jsonify({"message": "Book deleted"}), 200
