import psycopg2
from psycopg2 import pool
from app.config.setting import DB_CONFIG

db_pool = None

def init_db():
    global db_pool
    db_pool = psycopg2.pool.SimpleConnectionPool(
        minconn=1,
        maxconn=10,
        **DB_CONFIG
    )

def get_conn():
    if not db_pool:
        raise Exception("Database not initialized")
    return db_pool.getconn()

def release_conn(conn):
    db_pool.putconn(conn)

