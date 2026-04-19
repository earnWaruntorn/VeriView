from apify_client import ApifyClient
from app.config.setting import API_KEY

class ApifyService:
    def __init__(self, url):
        self.client = ApifyClient(API_KEY)
        self.url = url

    def get_product_detail(self):
        run_input = {
        "max_retries_per_url": 2, 
        "proxy": { 
            "useApifyProxy": True,
            "apifyProxyGroups": [
            "RESIDENTIAL" 
            ],
            "apifyProxyCountry": "TH" 
        },
        "scrape_type": "specific_product_urls", 
        "urls": [self.url]
        }

        run = self.client.actor("ecomscrape/lazada-product-scraper-rental").call(run_input=run_input)

        product_info = []
        print("💾 Check your data here: https://console.apify.com/storage/datasets/" + run["defaultDatasetId"])
        for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
            # item_json = eval(item)
            product_info.append(item)
        return product_info[0]
    
    def get_product_reviews(self):
        run_input = {
            "urls": [self.url],
            "proxyConfiguration": {
                "useApifyProxy": True,
                "apifyProxyGroups": ["RESIDENTIAL"],
            },
        }
        run = self.client.actor("getdataforme/lazada-product-review-scraper").call(
            run_input=run_input
        )

        product_reviews = []
        print("💾 Check your data here: https://console.apify.com/storage/datasets/" + run["defaultDatasetId"])
        for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
            print(item)
            product_reviews.append(item)
        return product_reviews