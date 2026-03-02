from flask import jsonify, request
from app.services.product_service import ProductService

class ProductController:
    def __init__(self):
        self.product_service = ProductService()
        
    def post_product_controller(self):
        data = request.get_json(silent=True)

        if not data or "url" not in data:
            return {"error": "url is required"}, 400

        url = data["url"]
        
        product_code = self.product_service.format_product_code(url)
        if not product_code:
            return {"error": "url format is not correct"}, 400
        product_code = product_code.group(0)

        product_id = self.product_service.get_product_id(product_code)
        if not product_id:
            isSuccess = self.product_service.post_product_code(product_code)
            if isSuccess:
                product_id = self.product_service.get_product_id(product_code)
            else:
                return {"error": "can not post product"}, 400

        return jsonify({
            "product_id": product_id,
        }), 201

    def get_product_information_controller(self):
        data = request.get_json(silent=True)

        if not data or "product_id" not in data:
            return {"error": "product_id is required"}, 400

        product_id = data["product_id"]
        product_code = self.product_service.get_product_code(product_id)
        url = "https://www.lazada.co.th/products/"+product_code+".html"
    

    
    
