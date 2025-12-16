# services/auth_service.py
import re
from models import User
from repositories.user_repo import (
    get_user_by_email,
    get_user_by_id,
    create_user,
)

# Password: at least 8 chars, 1 capital, 1 digit, 1 special char
PASSWORD_REGEX = re.compile(
    r"^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$"
)


class AuthError(Exception):
    pass


def _validate_password(password: str) -> None:
    if not password:
        raise AuthError("Password is required.")
    if not PASSWORD_REGEX.match(password):
        raise AuthError(
            "Password must be at least 8 characters long and contain "
            "a capital letter, a number, and a special character."
        )


def register_user(name: str, email: str, password: str) -> User:
    # Normalize inputs
    name = (name or "").strip()
    email = (email or "").strip().lower()
    password = password or ""

    # Basic required-fields check
    if not name or not email or not password:
        raise AuthError("Name, email and password are required.")

    # Email uniqueness
    existing = get_user_by_email(email)
    if existing:
        raise AuthError("Email already registered")

    # Strong password check
    _validate_password(password)

    # User creation (create_user will call user.set_password and hash it)
    user = create_user(name=name, email=email, password=password)
    return user


def authenticate_user(email: str, password: str) -> User:
    email = (email or "").strip().lower()
    password = password or ""

    if not email or not password:
        raise AuthError("Email and password are required.")

    user = get_user_by_email(email)
    if not user or not user.check_password(password):
        raise AuthError("Invalid credentials")

    return user


def get_user_or_raise(user_id: int) -> User:
    user = get_user_by_id(user_id)
    if not user:
        raise AuthError("User not found")
    return user
