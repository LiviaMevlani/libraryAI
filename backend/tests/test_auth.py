import pytest
from extensions import db
from models import User
from services.auth_service import register_user, authenticate_user, AuthError

@pytest.fixture
def app():
    from library_app import create_app
    app = create_app("dev")
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

def test_register_user(app):
    with app.app_context():
        user = register_user("Test User", "test@example.com", "Test123!@#")
        assert user.email == "test@example.com"
        assert user.check_password("Test123!@#")

def test_authenticate_user(app):
    with app.app_context():
        register_user("Test User", "test@example.com", "Test123!@#")
        user = authenticate_user("test@example.com", "Test123!@#")
        assert user is not None
