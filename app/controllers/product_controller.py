from flask import jsonify, request
from app.services.product_service import ProductService
import traceback

class ProductController:
    def __init__(self):
        self.product_service = ProductService()
        
    def post_product_controller(self):
        data = request.get_json(silent=True)

        if not data or "url" not in data:
            return {"error": "url is required"}, 400

        url = data["url"]
        
        product_code_match = self.product_service.format_product_code(url)
        if not product_code_match:
            return {"error": "Invalid product URL format", "test": product_code_match}, 422
        product_code = product_code_match.group(0)

        product_id = self.product_service.get_product_id(product_code)
        if not product_id:
            success = self.product_service.post_product_code(product_code)
            if success:
                product_id = self.product_service.get_product_id(product_code)
            else:
                return {"error": "Failed to create product"}, 500

        return jsonify({
            "product_id": product_id,
        }), 201

    def get_product_information_controller(self):
        product_id = request.args.get("product_id")
        if not product_id:
            return {"error": "product_id is required"}, 400

        try:
            product_info = self.product_service.get_product_info(product_id)
            if not product_info:
                return {"error": "Product not found"}, 404

            product_code = product_info.get("product_code")
            if not product_code:
                return {"error": "Product code missing"}, 500

            if not product_info.get("last_scraped_products"):
                url = f"https://www.lazada.co.th/products/{product_code}.html"

                scraped_product = self.product_service.scrape_product_info(url)
                if not scraped_product:
                    return {"error": "Failed to scrape product"}, 502

                success = self.product_service.post_product_detail(product_id, scraped_product)
                if not success:
                    return {"error": "Failed to save scraped product"}, 500

                product_info = self.product_service.get_product_info(product_id)

            return product_info, 200

        except Exception as e:
            print("Controller error:", e)
            traceback.print_exc()
            return {"error": "Internal server error"}, 500

        
    

    
    
