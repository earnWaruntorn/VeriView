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
        self.image_url = product[10]

    @staticmethod
    def _serialize_dt(val):
        """Convert datetime to ISO string for JSON serialization."""
        if val is None:
            return None
        if hasattr(val, "isoformat"):
            return val.isoformat()
        return str(val)

    def to_dict(self):
        return {
            "product_id": self.product_id,
            "product_name": self.product_name,
            "product_code": self.product_code,
            "store": self.store,
            "price": float(self.price) if self.price is not None else None,
            "status": self.status,
            "created_at": self._serialize_dt(self.created_at),
            "last_scraped_products": self._serialize_dt(self.last_scraped_products),
            "last_predicted": self._serialize_dt(self.last_predicted),
            "last_scraped_reviews": self._serialize_dt(self.last_scraped_reviews),
            "image_url": self.image_url
        }