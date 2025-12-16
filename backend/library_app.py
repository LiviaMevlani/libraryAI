from flask import Flask, jsonify

from config import config_by_name
from extensions import db, migrate, jwt, cors

# import models so migrations detect them
from models import User, Book

# import blueprints
from routes.auth_routes import auth_bp
from routes.book_routes import book_bp
from routes.admin_routes import admin_bp
from routes.ai_routes import ai_bp


def create_app(config_name: str = "dev") -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    # init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # health check
    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    # register blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(book_bp, url_prefix="/api/books")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")

    return app


# global app object that Flask CLI will use
app = create_app("dev")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
