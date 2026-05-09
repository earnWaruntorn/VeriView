from dotenv import load_dotenv
import os

load_dotenv()

# App
APP_ENV = os.getenv("APP_ENV", "development")
DEBUG = APP_ENV == "development"

# Database
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "dbname": os.getenv("DB_NAME", "fake_review"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "postgres"),
}

API_KEY_PRODUCT = os.getenv("API_KEY_PRODUCT", "default_product_key")
API_KEY_REVIEW = os.getenv("API_KEY_REVIEW", "default_review_key")