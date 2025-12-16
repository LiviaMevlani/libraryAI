# routes/ai_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from services.ai_service import handle_ai_query, AIError, get_recommendations, get_insights
from services.auth_service import get_user_or_raise

ai_bp = Blueprint("ai", __name__)


@ai_bp.post("/query")
@jwt_required()
def ai_query():
    """
    AI query endpoint with user authorization.
    Admin can query globally; users limited to their own data.
    """
    current_user_id = int(get_jwt_identity())
    user = get_user_or_raise(current_user_id)
    
    data = request.get_json() or {}
    question = data.get("question")
    
    if not question:
        return jsonify({"message": "Question is required."}), 400
    
    try:
        # Pass user context for authorization
        result = handle_ai_query(question, user)
        return jsonify(result), 200
    except AIError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        # Log error but don't expose details
        print(f"AI query error: {e}")  # In production, use proper logging
        return jsonify({"message": "An unexpected error occurred."}), 500


@ai_bp.get("/recommendations")
@jwt_required()
def ai_recommendations():
    current_user_id = int(get_jwt_identity())
    user = get_user_or_raise(current_user_id)
    
    try:
        recommendations = get_recommendations(user)
        return jsonify(recommendations), 200
    except AIError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        return jsonify({"message": "An error occurred generating recommendations."}), 500


@ai_bp.get("/insights")
@jwt_required()
def ai_insights():
    current_user_id = int(get_jwt_identity())
    user = get_user_or_raise(current_user_id)
    
    try:
        insights = get_insights(user)
        return jsonify(insights), 200
    except AIError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        return jsonify({"message": "An error occurred generating insights."}), 500
