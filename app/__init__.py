from flask import Flask, jsonify
from app.infrastructure.database import init_db
from flask_swagger import swagger
from flask_swagger_ui import get_swaggerui_blueprint
from app.routes.route import api_bp  
from app.routes.product_route import ProductRoute  
# from app.routes.product_route import product_bp  


        
def create_app():
    app = Flask(__name__)

    init_db()

    product_route = ProductRoute()

    app.register_blueprint(api_bp)
    app.register_blueprint(product_route.product_bp)

    @app.route("/swagger.json")
    def swagger_spec():
            swag = swagger(app)   
            swag["info"]["title"] = "Fake Review Detection API"
            swag["info"]["version"] = "1.0"
            swag["basePath"] = "/"
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