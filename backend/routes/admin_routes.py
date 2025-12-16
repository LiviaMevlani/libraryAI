# routes/admin_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User
from extensions import db
from services.auth_service import get_user_or_raise
from services.admin_service import (
    AdminError,
    list_users_admin,
    update_user_role_admin,
    delete_user_admin,
    update_user_admin,
    list_books_admin,
)

admin_bp = Blueprint("admin", __name__)


# Small helpers to serialize models → JSON

def _serialize_user(user):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def _serialize_book(book):
    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "genre": book.genre,
        "price": float(book.price) if book.price is not None else None,
        "pages": book.pages,
        "reading_status": book.reading_status,
        "user_id": book.user_id,
        "created_at": book.created_at.isoformat() if book.created_at else None,
    }


# -----------------------------------------------------------------------------
# USERS (Admin only)
# -----------------------------------------------------------------------------

@admin_bp.get("/users")
@jwt_required()
def list_users_route():
    current_user_id = int(get_jwt_identity())
    current_user = get_user_or_raise(current_user_id)

    try:
        users = list_users_admin(current_user)
    except AdminError as e:
        return jsonify({"message": str(e)}), 403

    return jsonify([_serialize_user(u) for u in users]), 200


@admin_bp.post("/users")
@jwt_required()
def admin_create_user():
    """Admin-only: create a new user."""
    current_user_id = int(get_jwt_identity())
    current_user = get_user_or_raise(current_user_id)
    data = request.get_json() or {}

    if not current_user.is_admin:
        return jsonify({"message": "Not authorized"}), 403

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = (data.get("role") or "user").strip().lower()

    if not name or not email or not password:
        return jsonify({"message": "Name, email, and password are required"}), 400

    if role not in ("user", "admin"):
        return jsonify({"message": "Role must be 'user' or 'admin'"}), 400

    try:
        from services.auth_service import register_user
        user = register_user(name=name, email=email, password=password)
        user.role = role
        db.session.commit()
        return jsonify(_serialize_user(user)), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 400


@admin_bp.patch("/users/<int:user_id>")
@jwt_required()
def admin_update_user(user_id: int):
    current_user_id = int(get_jwt_identity())
    current_user = get_user_or_raise(current_user_id)
    data = request.get_json() or {}

    try:
        updated = update_user_admin(current_user, user_id, data)
    except AdminError as e:
        return jsonify({"message": str(e)}), 400

    return jsonify(_serialize_user(updated)), 200


@admin_bp.delete("/users/<int:user_id>")
@jwt_required()
def admin_delete_user(user_id: int):
    current_user_id = int(get_jwt_identity())
    current_user = get_user_or_raise(current_user_id)

    try:
        delete_user_admin(current_user, user_id)
    except AdminError as e:
        return jsonify({"message": str(e)}), 400

    return jsonify({"message": "User deleted"}), 200

# -----------------------------------------------------------------------------
# BOOKS (Admin only)
# -----------------------------------------------------------------------------

@admin_bp.get("/books")
@jwt_required()
def list_admin_books_route():
    """
    List all books for admin dashboard.
    Optional filters: ?genre=Fantasy&status=reading
    """
    current_user_id = int(get_jwt_identity())
    current_user = get_user_or_raise(current_user_id)

    genre = request.args.get("genre")
    status = request.args.get("status")

    try:
        books = list_books_admin(current_user, genre=genre, status=status)
    except AdminError as e:
        return jsonify({"message": str(e)}), 400

    return jsonify([_serialize_book(b) for b in books]), 200


@admin_bp.delete("/books/<int:book_id>")
@jwt_required()
def admin_delete_book(book_id: int):
    """Admin-only: delete any book."""
    current_user_id = int(get_jwt_identity())
    current_user = get_user_or_raise(current_user_id)

    if not current_user.is_admin:
        return jsonify({"message": "Not authorized"}), 403

    from services.book_service import delete_book_for_user
    try:
        delete_book_for_user(current_user, book_id)
        return jsonify({"message": "Book deleted"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

