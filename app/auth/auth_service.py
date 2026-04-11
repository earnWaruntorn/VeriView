import re
from app.infrastructure.database import get_conn, release_conn
from flask_jwt_extended import create_access_token

class AuthService:
    def get_user_auth(self, username, password):
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT Get_UserAuth(%s, %s);",
                    (username, password)
                )
                row = cur.fetchone()
                return row[0] 
        finally:
            release_conn(conn)
    
    def generate_token(self, user):
        token =  create_access_token(
                identity=str(user["user_id"]),
                additional_claims={"role": user["user_role"]}
            )
        return token