from flask import jsonify, request
from app.services.admin_service import AdminService
from app.services.review_service import ReviewService

class AdminController:
    def __init__(self):
        self.admin_service = AdminService()
        self.review_service = ReviewService()

    def get_log_controller(self):
        rows = self.admin_service.get_all_product()
        products = self.admin_service.to_product_models(rows)
        
        # last_scrape ต้องแบ่งเป็น last_scrape product, last_scrape review
        # get_reviews ->rviews including predict if none -> store in DB -> retrieve review from DB
        # if last_scrape none -> call model -> store in DB -> retreive predicted data from
        # return reviews   

        return jsonify({
            "products": products
        }), 201 

    def patch_reanalyze_reviews_controller(self):
        response_data = {
            "success": False
        }

        try:
            product_id = request.args.get("product_id")

            if not product_id:
                response_data["error"] = "product_id is required"
                return jsonify(response_data), 400

            product = self.review_service.get_product_info(product_id)
            if not product:
                response_data["error"] = "Product not found"
                return jsonify(response_data), 404

            url = f"https://www.lazada.co.th/products/{product['product_code']}.html"
                
            scraped_reviews = self.review_service.scrape_reviews(url)
            if not scraped_reviews:
                response_data["error"] = "Failed to scrape reviews from Lazada"
                return jsonify(response_data), 502

            success = self.review_service.post_reviews(product_id, scraped_reviews)
            if not success:
                response_data["error"] = "Failed to save scraped reviews to database"
                return jsonify(response_data), 500
            
            reviews = self.review_service.get_reviews(product_id)

            predicted_reviews = self.review_service.predict_reviews(reviews)
                
            success = self.review_service.post_predicted_reviews(product_id, predicted_reviews)
            if not success:
                response_data["error"] = "Failed to save model predictions"
                return jsonify(response_data), 500
                
            reviews = self.review_service.get_reviews(product_id)

            response_data["success"] = True
            response_data["data"] = reviews
            return jsonify(response_data), 200

        except Exception as e:
            print(f"CRITICAL ERROR in get_review_controller: {str(e)}")
            response_data["error"] = "Internal Server Error"
            return jsonify(response_data), 500