from flask import Blueprint
from app.middleware.role_required import role_required
from app.controllers.admin_controller import AdminController

class AdminRoute:
    def __init__(self):
        self.admin_bp = Blueprint("admin", __name__)
        self.admin_controller = AdminController()
        
        self.admin_bp.add_url_rule(
            "/admin",
            endpoint="get_log",
            view_func=self.get_log_route,
            methods=["GET"]
        )

        self.admin_bp.add_url_rule(
            "/admin/re-analyze",
            endpoint="patch_reviews",
            view_func=self.patch_re_analyze_route,
            methods=["PATCH"]
        )
    
    @role_required("admin")
    def get_log_route(self):
        """
        Retrieve log detail
        ---
        tags:
          - Admin
        consumes:
          - application/json
        security:
          - BearerAuth: []
        responses:
          200:
            description: Log details retrieved successfully
            schema:
              type: object
              properties:
                status:
                  type: string
                  example: "success"
                data:
                  type: array
                  items:
                    type: object
          401:
            description: Unauthorized - Token is missing or invalid
          403:
            description: Forbidden - Admin role required
        """
        return self.admin_controller.get_log_controller()
    
    @role_required("admin")
    def patch_re_analyze_route(self):
        """
        Re-analyze reviews for a specific product
        ---
        tags:
          - Admin
        parameters:
          - name: product_id
            in: query
            type: integer
            required: true
            description: The ID of the product to re-analyze
        security:
          - BearerAuth: []
        responses:
          200:
            description: Re-analysis triggered successfully
            schema:
              type: object
              properties:
                message:
                  type: string
                  example: "Re-analysis started for product ID 10"
          400:
            description: Invalid product ID provided
          401:
            description: Unauthorized
          403:
            description: Forbidden
        """
        return self.admin_controller.patch_reanalyze_reviews_controller()