import os
import sys
from dotenv import load_dotenv
from apify_client import ApifyClient

load_dotenv('c:/Users/HP/Desktop/Final/veriview-backend/VeriView/.env')

API_KEY_PRODUCT = os.getenv("API_KEY_PRODUCT")
if not API_KEY_PRODUCT:
    print("API_KEY_PRODUCT not found")
    sys.exit(1)

client = ApifyClient(API_KEY_PRODUCT)
url = "https://www.lazada.co.th/products/test-i123456.html"

run_input = {
    "scrape_type": "specific_product_urls",   
    "urls": [url],
    "ignore_url_failures": False,  # SET TO FALSE TO SEE ERRORS
    "max_retries_per_url": 1,  
    "proxy": {
        "useApifyProxy": True,
        "apifyProxyGroups": ["RESIDENTIAL"],
        "apifyProxyCountry": "TH",  
    },
}

try:
    print("Calling actor...")
    run = client.actor("ecomscrape/lazada-product-scraper-rental").call(run_input=run_input)
    print("Run finished with status:", run.get("status"))
    print("Dataset ID:", run.get("defaultDatasetId"))
    
    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
    print("Number of items:", len(items))
    if items:
        print("First item keys:", items[0].keys())
except Exception as e:
    print("Exception:", str(e))
