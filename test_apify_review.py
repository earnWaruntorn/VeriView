import os
import sys
from dotenv import load_dotenv
from apify_client import ApifyClient

load_dotenv('c:/Users/HP/Desktop/Final/veriview-backend/VeriView/.env')

API_KEY_REVIEW = os.getenv("API_KEY_REVIEW")
client = ApifyClient(API_KEY_REVIEW)
url = "https://www.lazada.co.th/products/test-i123456.html"

run_input = {
    "urls": [url],
    "proxyConfiguration": {
        "useApifyProxy": True,
        "apifyProxyGroups": ["RESIDENTIAL"],
    },
}

try:
    print("Calling review actor...")
    run = client.actor("getdataforme/lazada-product-review-scraper").call(run_input=run_input)
    print("Run finished with status:", run.get("status"))
except Exception as e:
    print("Exception:", str(e))
