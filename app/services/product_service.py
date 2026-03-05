import re
from app.infrastructure.database import get_conn, release_conn
from app.services.scraper.apify_service import ApifyService

class ProductService:

    def format_product_code(self, url):
        product_code_format = r'pdp-i\d*-s\d*'
        product_code =  re.search(product_code_format, url)
        return product_code

    def get_product_id(self, product_code):
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT Get_ProductId(%s);",
                    (product_code,)
                )
                row = cur.fetchone()
                return row[0]
        finally:
            release_conn(conn)

    def get_product_code(self, product_id):
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT Get_ProductCode(%s);",
                    (product_id,)
                )
                row = cur.fetchone()
                return row[0]
        finally:
            release_conn(conn)
    
    def get_product_info(self, product_id):
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT Get_ProductInfo(%s);",
                    (int(product_id),)
                )
                row = cur.fetchone()
                return row[0]
        finally:
            release_conn(conn)

    def post_product_code(self, product_code):
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                try:
                    cur.execute(
                        "CALL Post_ProductCode(%s);",
                        (product_code,)
                    )
                    conn.commit()
                    return True
                except Exception as e:
                    conn.rollback()
                    print("Database error:", e)
                    return False
        finally:
            release_conn(conn)
    
    def scrape_product_info(self, url):
        apify_service = ApifyService(url)
        scraped_product = apify_service.get_product_detail()
        return scraped_product
    
    def post_product_detail(self, product_id, product_detail):
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                try:
                    cur.execute(
                        "CALL Post_ProductInfo(%s, %s, %s, %s);",
                        (
                            product_id,
                            product_detail["name"], 
                            product_detail["seller"]["name"],
                            product_detail["sku"]["0"]["price"]["sale_price"]["value"])
                    )
                    conn.commit()
                    return True
                except Exception as e:
                    conn.rollback()
                    print("Database error:", e)
                    return False
        finally:
            release_conn(conn)
