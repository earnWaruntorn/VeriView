import os
import sys
from dotenv import load_dotenv
from apify_client import ApifyClient

load_dotenv('c:/Users/HP/Desktop/Final/veriview-backend/VeriView/.env')

API_KEY_PRODUCT = os.getenv("API_KEY_PRODUCT")
client = ApifyClient(API_KEY_PRODUCT)
url = "https://www.lazada.co.th/products/pdp-i6060583359-s26296570135.html"

run_input = {
    "max_retries_per_url": 2, 
    "proxy": { 
        "useApifyProxy": True,
        "apifyProxyGroups": ["RESIDENTIAL"],
        "apifyProxyCountry": "TH" 
    },
    "scrape_type": "specific_product_urls", 
    "urls": [url]
}

try:
    print("Calling actor...")
    run = client.actor("ecomscrape/lazada-product-scraper").call(run_input=run_input)
    print("Run finished with status:", run.get("status"))
    
    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
    print("Number of items:", len(items))
    if items:
        import json
        print(json.dumps(items[0], indent=2))
except Exception as e:
    print("Exception:", str(e))
