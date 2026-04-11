from flask import Flask, jsonify
from app.infrastructure.database import init_db
from flask_swagger import swagger
from flask_swagger_ui import get_swaggerui_blueprint
from app.routes.route import api_bp  
from app.routes.product_route import ProductRoute  
from app.routes.review_route import ReviewRoute
from app.routes.admin_route import AdminRoute
from app.auth.auth_routes import AuthRoute
from flask_jwt_extended import JWTManager
from flask_cors import CORS
# from app.routes.product_route import product_bp  

def create_app():
    app = Flask(__name__)
    CORS(app)

    init_db()

    app.config["JWT_SECRET_KEY"] = "super-secret"  # Change this!
    jwt = JWTManager(app)

    auth_route = AuthRoute()
    admin_route = AdminRoute()
    product_route = ProductRoute()
    review_route = ReviewRoute()

    app.register_blueprint(auth_route.auth_bp, url_prefix="/auth")
    app.register_blueprint(api_bp)
    app.register_blueprint(admin_route.admin_bp)
    app.register_blueprint(product_route.product_bp)
    app.register_blueprint(review_route.review_bp)

    @app.route("/swagger.json")
    def swagger_spec():
            swag = swagger(app)   
            swag["info"]["title"] = "Fake Review Detection API"
            swag["info"]["version"] = "1.0"

            swag["basePath"] = "/"

            swag["securityDefinitions"] = {
                "BearerAuth": {
                    "type": "apiKey",
                    "name": "Authorization",
                    "in": "header",
                    "description": "Enter: Bearer <JWT_TOKEN>"
                }
            }
            return jsonify(swag)

    # Swagger UI
    SWAGGER_URL = "/docs"
    API_URL = "/swagger.json"

    swaggerui_blueprint = get_swaggerui_blueprint(
        SWAGGER_URL,
        API_URL,
        config={"app_name": "Fake Review Detection API"}
    )

    app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

        
    return app