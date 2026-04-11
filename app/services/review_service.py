import re
import os
import pickle
import joblib
from pythainlp.tokenize import subword_tokenize
import pandas as pd
from app.infrastructure.database import get_conn, release_conn
from app.services.scraper.apify_service import ApifyService

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

TFIDF_PATH = os.path.join(BASE_DIR, "models", "tfidf_vectorizer.pkl")
MODEL_PATH = os.path.join(BASE_DIR, "models", "fake_review_model.pkl")

class ReviewService:
    def __init__(self):
        with open(TFIDF_PATH, "rb") as f:
            self.tfidf = joblib.load(f)

        with open(MODEL_PATH, "rb") as f:
            self.model = joblib.load(f)
    
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

    def scrape_reviews(self, url):
        apify_service = ApifyService(url)
        scraped_reviews = apify_service.get_product_reviews()
        return scraped_reviews
    
    def post_review(self, product_id, review):
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                try:
                    cur.execute(
                        "CALL Post_ScrapedReview(%s, %s, %s, %s);",
                        (
                            review["Review_Id"],
                            int(product_id), 
                            review["Body"],
                            int(review["Rating"]))
                    )
                    conn.commit()
                    return True
                except Exception as e:
                    conn.rollback()
                    print("Database error:", e)
                    return False
        finally:
            release_conn(conn)
    
    def post_reviews(self, product_id, reviews):
        for r in reviews:
            success = self.post_review(product_id, r)
        return success
    
    def post_predicted_review(self, product_id, review):
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                try:
                    cur.execute(
                        "CALL Post_PredictedReview(%s, %s, %s, %s, %s);",
                        (
                            product_id,
                            review["review_id"],
                            review["version_id"],
                            review["predicted_label"],
                            review["confidence_score"]
                        )
                    )
                    conn.commit()
                    return True
                except Exception as e:
                    conn.rollback()
                    print("Database error:", e)
                    return False
        finally:
            release_conn(conn)
    
    def post_predicted_reviews(self, product_id, reviews):
        for r in reviews:
            success = self.post_predicted_review(product_id, r)
        return success
    
    def get_reviews(self, product_id):
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT Get_Reviews(%s);",
                    (int(product_id),)
                )
                row = cur.fetchone()
                return row[0]
        finally:
            release_conn(conn)

    def clean_text(self, text):
        if pd.isna(text):
            return text

        text = str(text)

        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[#/\\"\'_\-\(\)\[\]\{\}\|<>@*^%$~+=`]', '', text)
        text = re.sub(r'\n+', ' ', text)
        text = re.sub(r'\d+', '', text)
        text = re.sub(r'http\S+|www\S+', '', text)
        text = re.sub(r'[^\w\s\u0E00-\u0E7F]', '', text)
        text = re.sub(r' ', '', text)

        return text.strip()

    def predict_reviews(self, reviews):
        processed_texts = []
        indices = []

        for idx, r in enumerate(reviews):
            text = r.get("review")
            if text:
                cleaned = self.clean_text(text)

                tokens = subword_tokenize(
                    cleaned,
                    engine="wangchanberta",
                    keep_whitespace=False
                )
 
                tokenized_text = " ".join(tokens)

                processed_texts.append(tokenized_text)
                indices.append(idx)

        if not processed_texts:
            return reviews

        X = self.tfidf.transform(processed_texts)

        preds = self.model.predict(X)
        probs = self.model.predict_proba(X)

        for i, idx in enumerate(indices):
            reviews[idx]["predicted_label"] = "real" if int(preds[i]) == 0 else "fake"
            reviews[idx]["prediction"] = int(preds[i])
            reviews[idx]["confidence_score"] = float(max(probs[i]))

        return reviews