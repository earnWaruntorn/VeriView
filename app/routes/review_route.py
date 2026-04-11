from flask import Blueprint
from app.controllers.review_controller import ReviewController

class ReviewRoute:
    def __init__(self):
        self.review_bp = Blueprint("review", __name__)
        self.review_controller = ReviewController()
        self.review_bp.add_url_rule(
            "/review",
            endpoint="get_review",
            view_func=self.get_review_route,
            methods=["GET"]
        )
    
    def get_review_route(self):
        """
        Retrieve reviews by product id
        ---
        tags:
          - Review
        consumes:
          - application/json
        parameters:
          - in: query
            name: product_id
            required: true
            type: integer
            example: 10
        responses:
          200:
            description: List of reviews retrieved successfully
            schema:
              type: array
              items:
                type: object
                properties:
                  review_id:
                    type: integer
                  version_id:
                    type: integer
                  review:
                    type: string
                  rating:
                    type: integer
                  predicted_label:
                    type: string
                  confidence_score:
                    type: number
                  predicted_at:
                    type: string
          404:
            description: Product or reviews not found
        """
        return self.review_controller.get_review_controller()