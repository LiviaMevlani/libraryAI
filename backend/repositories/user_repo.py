# repositories/user_repo.py
from typing import Optional,List 
from extensions import db
from models import User


def get_user_by_email(email: str) -> Optional[User]:
    return User.query.filter_by(email=email).first()


def get_user_by_id(user_id: int) -> Optional[User]:
    return User.query.get(user_id)


def create_user(name: str, email: str, password: str, role: str = "user") -> User:
    user = User(name=name, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return user


def get_all_users() -> List[User]:
    return User.query.order_by(User.created_at.desc()).all()

def save_user(user: User) -> User:
    """Utility to commit changes after updating a user."""
    db.session.add(user)
    db.session.commit()
    return user

def delete_user(user: User) -> None:
    db.session.delete(user)
    db.session.commit()