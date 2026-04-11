from flask import Blueprint
from app.auth.auth_controller import AuthController

class AuthRoute:
    def __init__(self):
        self.auth_bp = Blueprint("auth", __name__)
        self.auth_controller = AuthController()
        self.auth_bp.add_url_rule(
            "/login",
            endpoint="login",
            view_func=self.login_route,
            methods=["GET"]
        )

    def login_route(self):
        """
        Login by username and password
        ---
        tags:
          - Auth
        consumes:
          - application/json
        parameters:
          - in: query
            name: username
            required: true
            type: string
            example: test
          - in: query
            name: password
            required: true
            type: string
            example: test1234
        responses:  # เพิ่มส่วนนี้เข้าไป
          200:
            description: Login successful
            schema:
              type: object
              properties:
                access_token:
                  type: string
                  example: "eyJhbG..."
          401:
            description: Invalid credentials
        """

        return self.auth_controller.login_controller()