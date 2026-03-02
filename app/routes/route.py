from flask import Blueprint, jsonify

api_bp = Blueprint("api", __name__)

@api_bp.route("/health", methods=["GET"])
def health_check():
    """
    Health check endpoint
    ---

    tags:
      - Health
      
    responses:
      200:
        description: API is running
    """
    return jsonify({"status": "ok"})
