from flask import Blueprint, jsonify, request
from app.controllers.product_controller import ProductController

class ProductRoute:
    def __init__(self):
        self.product_bp = Blueprint("product", __name__)
        self.product_controller = ProductController()
        self.product_bp.add_url_rule(
            "/product",
            endpoint="create_product",
            view_func=self.post_product_route,
            methods=["POST"]
        )

        self.product_bp.add_url_rule(
            "/product",
            endpoint="get_product",
            view_func=self.get_product_route,
            methods=["GET"]
        )

    def post_product_route(self):
        """
        Create product by URL
        ---
        tags:
          - Product
        consumes:
          - application/json
        parameters:
          - in: body
            name: body
            required: true
            schema:
              type: object
              required:
                - url
              properties:
                url:
                  type: string
                  example: "https://www.lazada.co.th/products/abc123"
        responses:
          201:
            description: Product created successfully
            schema:
              type: object
              properties:
                message:
                  type: string
                  example: "Product created"
                product_id:
                  type: integer
          400:
            description: Invalid URL or missing parameters
        """
        return self.product_controller.post_product_controller()
    
    def get_product_route(self):
        """
        Retrieve product info by product id
        ---
        tags:
          - Product
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
            description: Product info retrieved successfully
            schema:
              type: object
              properties:
                product_name:
                  type: string
                product_code:
                  type: string
                store:
                  type: string
                price:
                  type: number
                status:
                  type: string
                last_scraped_product:
                  type: string
                last_scraped_reviews:
                  type: string
                last_predicted:
                  type: string
          404:
            description: Product not found
        """
        return self.product_controller.get_product_information_controller()