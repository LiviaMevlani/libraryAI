# routes/auth_routes.py
import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from extensions import db
from models import User
from services import auth_service
from services.auth_service import AuthError, register_user, authenticate_user, get_user_or_raise
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)

PASSWORD_REGEX = re.compile(
    r"^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$"
)
# Explanation:
# - (?=.*[A-Z])  -> at least one uppercase
# - (?=.*\d)     -> at least one digit
# - (?=.*[^A-Za-z0-9]) -> at least one special char
# - .{8,}        -> at least 8 characters total

def validate_register_payload(data: dict):
    errors = {}

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not name:
        errors["name"] = "Name is required."

    if not email:
        errors["email"] = "Email is required."
    elif "@" not in email:
        errors["email"] = "Email is not valid."

    if not password:
        errors["password"] = "Password is required."
    elif not PASSWORD_REGEX.match(password):
        errors["password"] = (
            "Password must be at least 8 characters and contain "
            "one uppercase letter, one number, and one special character."
        )

    return errors


def validate_login_payload(data: dict):
    errors = {}

    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not email:
        errors["email"] = "Email is required."
    if not password:
        errors["password"] = "Password is required."

    return errors

EMAIL_REGEX = re.compile(r"[^@]+@[^@]+\.[^@]+")

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    data = request.get_json() or {}
    errors = validate_register_payload(data)

    if errors:
        return jsonify({"errors": errors}), 400

    name = data["name"].strip()
    email = data["email"].strip()
    password = data["password"]

    try:
        user = auth_service.register_user(name=name, email=email, password=password)
    except AuthError as e:
        # e.g. email already used
        return jsonify({"message": str(e)}), 400

    return jsonify({"message": "User created"}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    errors = validate_login_payload(data)

    if errors:
        return jsonify({"errors": errors}), 400

    email = data["email"].strip()
    password = data["password"]

    try:
        user = auth_service.authenticate_user(email=email, password=password)
    except AuthError as e:
        # invalid credentials
        return jsonify({"message": str(e)}), 401

    access_token = create_access_token(identity=str(user.id))

    return jsonify(
        {
            "access_token": access_token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
            },
        }
    )




@auth_bp.get("/me")
@jwt_required()
def me():
    current_user_id = int(get_jwt_identity())
    try:
        user = get_user_or_raise(current_user_id)
    except AuthError as e:
        return jsonify({"message": str(e)}), 404

    return jsonify(
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        }
    )
