import re
from app.infrastructure.database import get_conn, release_conn
from app.services.scraper.apify_service import ApifyService

class ProductService:

    def format_product_code(url):
        product_code_format = r'pdp-i\d*-s\d*'
        product_code =  re.search(product_code_format, url)
        return product_code

    def get_product_id(product_code):
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

    def get_product_code(product_id):
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

    def post_product_code(product_code):
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
    
    def get_product_info(url):
        apify_service = ApifyService(url)
        product_detail = apify_service.get_product_detail()
        product_reviews = apify_service.get_product_reviews()
        return product_detail, product_reviews
    
    def post_product_detail(product_detail):
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                try:
                    cur.execute(
                        "CALL Post_ProductCode(%s);",
                        (product_detail,)
                    )
                    conn.commit()
                    return True
                except Exception as e:
                    conn.rollback()
                    print("Database error:", e)
                    return False
        finally:
            release_conn(conn)
