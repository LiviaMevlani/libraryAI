import os
import sys
import pytest

# Add backend root to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from extensions import db
from services.auth_service import register_user
from models import User


@pytest.fixture
def app():
    # Important: create a fresh app for tests using sqlite in-memory
    from library_app import create_app

    app = create_app("dev")
    app.config.update(
        TESTING=True,
        SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def admin_user_id(app):
    """Return admin user id (avoid returning ORM object)."""
    with app.app_context():
        user = register_user("Admin User", "admin@test.com", "Admin123!@#")
        user.role = "admin"
        db.session.commit()
        return user.id


@pytest.fixture
def regular_user_id(app):
    """Return regular user id (avoid returning ORM object)."""
    with app.app_context():
        user = register_user("Regular User", "user@test.com", "User123!@#")
        db.session.commit()
        return user.id


@pytest.fixture
def admin_user(app, admin_user_id):
    """Return a fresh admin ORM object bound to the current session."""
    with app.app_context():
        return db.session.get(User, admin_user_id)


@pytest.fixture
def regular_user(app, regular_user_id):
    """Return a fresh regular ORM object bound to the current session."""
    with app.app_context():
        return db.session.get(User, regular_user_id)
