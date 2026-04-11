class ProductModel:
    def __init__(self, product):
        self.product_id = product[0]
        self.product_name = product[1]
        self.product_code = product[2]
        self.store = product[3]
        self.price = product[4]
        self.status = product[5]
        self.created_at = product[6]
        self.last_scraped_products = product[7]
        self.last_predicted = product[8]
        self.last_scraped_reviews = product[9]

    def to_dict(self):
        return {
            "product_id": self.product_id,
            "product_name": self.product_name,
            "product_code": self.product_code,
            "store": self.store,
            "price": self.price,
            "status": self.status,
            "last_scraped_products": self.last_scraped_products,
            "last_predicted": self.last_predicted,
            "last_scraped_reviews": self.last_scraped_reviews
        }