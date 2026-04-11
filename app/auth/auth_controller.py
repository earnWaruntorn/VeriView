from flask import jsonify, request
from app.auth.auth_service import AuthService

class AuthController:
    def __init__(self):
        self.auth_service = AuthService()
        
    def login_controller(self):
        username = request.args.get("username")
        password = request.args.get("password")

        if not username and not password:
            return {"error": "username or password is missing"}, 400
        
        user = self.auth_service.get_user_auth(username, password)

        if not user:
            return {"error": "invalid username or password"}, 400
        # check with database 
        # if true then generate token
        # else error invalid username or password
        
        token = self.auth_service.generate_token(user)
        
        return jsonify({
            "access_token": token
        }), 201    