import re
from app.infrastructure.database import get_conn, release_conn
from app.models.product_model import ProductModel

class AdminService:
    def get_all_product(self):
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT * FROM Products;"
                )
                rows = cur.fetchall()
                return rows
        finally:
            release_conn(conn)
    
    def to_product_models(self, rows):
        products = []
        for r in rows:
            products.append(ProductModel(r).to_dict())
        return products


