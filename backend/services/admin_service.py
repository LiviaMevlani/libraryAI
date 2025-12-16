# services/admin_service.py
from typing import List, Optional
from models import User, Book
from extensions import db
from repositories.user_repo import (
    get_all_users,
    get_user_by_id,
    save_user,
)
from repositories.book_repo import get_all_books
from services.book_service import ALLOWED_STATUSES  # reuse your constant


class AdminError(Exception):
    pass


def _require_admin(current_user: User) -> None:
    if not current_user.is_admin:
        raise AdminError("Not authorized. Admins only.")


# -----------------------------------------------------------------------------
# USERS
# -----------------------------------------------------------------------------

def list_users_admin(current_user: User) -> List[User]:
    _require_admin(current_user)
    return get_all_users()


def update_user_role_admin(current_user: User, target_user_id: int, new_role: str) -> User:
    _require_admin(current_user)

    new_role = (new_role or "").strip().lower()
    if new_role not in {"user", "admin"}:
        raise AdminError("Invalid role. Allowed values: 'user', 'admin'.")

    user = get_user_by_id(target_user_id)
    if not user:
        raise AdminError("User not found.")

    # optional: prevent changing your own role
    # if user.id == current_user.id:
    #     raise AdminError("You cannot change your own role.")

    user.role = new_role
    save_user(user)
    return user


def update_user_admin(current_user: User, user_id: int, data: dict) -> User:
    """
    Admin can update a user's name, email, and role.
    """
    if not current_user.is_admin:
        raise AdminError("Not authorized")

    user = get_user_by_id(user_id)
    if not user:
        raise AdminError("User not found")

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    role = (data.get("role") or "").strip().lower()

    if name:
        user.name = name
    if email:
        user.email = email
    if role:
        if role not in {"user", "admin"}:
            raise AdminError("Invalid role. Allowed: user, admin")
        user.role = role

    save_user(user)
    return user


def delete_user_admin(current_user: User, target_user_id: int) -> None:
    if not current_user.is_admin:
        raise AdminError("Not authorized")

    if current_user.id == target_user_id:
        raise AdminError("You cannot delete yourself.")

    user = User.query.get(target_user_id)
    if not user:
        raise AdminError("User not found")

    # Delete all this user's books first
    Book.query.filter_by(user_id=user.id).delete()

    # Then delete the user
    db.session.delete(user)
    db.session.commit()

# -----------------------------------------------------------------------------
# BOOKS
# -----------------------------------------------------------------------------

def list_books_admin(
    current_user: User,
    genre: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Book]:
    """
    Admin book listing for dashboard.
    Can filter by genre and reading_status.
    """
    _require_admin(current_user)

    books = get_all_books()

    if genre:
        genre = genre.strip().lower()
        books = [b for b in books if (b.genre or "").lower() == genre]

    if status:
        status = status.strip().lower()
        if status not in ALLOWED_STATUSES:
            raise AdminError(
                "Invalid status. Allowed values: planned, reading, completed."
            )
        books = [b for b in books if (b.reading_status or "").lower() == status]

    return books
