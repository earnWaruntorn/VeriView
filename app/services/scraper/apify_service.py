from apify_client import ApifyClient
from app.config.setting import API_KEY_PRODUCT, API_KEY_REVIEW

class ApifyService:
    def __init__(self, url):
        self.client_product = ApifyClient(API_KEY_PRODUCT)
        self.client_review = ApifyClient(API_KEY_REVIEW)
        self.url = url

    def get_product_detail(self):
        run_input = {
            "scrape_type": "specific_product_urls",   
            "urls": [self.url],
            "ignore_url_failures": True,
            "max_retries_per_url": 5,  
            "proxy": {
                "useApifyProxy": True,
                "apifyProxyGroups": ["RESIDENTIAL"],
                "apifyProxyCountry": "TH",  
            },
        }

        run = self.client_product.actor("ecomscrape/lazada-product-scraper-rental").call(run_input=run_input)

        product_info = []
        print("💾 Check your data here: https://console.apify.com/storage/datasets/" + run["defaultDatasetId"])
        for item in self.client_product.dataset(run["defaultDatasetId"]).iterate_items():
            # item_json = eval(item)
            product_info.append(item)
        return product_info[0]
    
    def get_product_reviews(self):
        run_input = {
            "urls": [self.url],
            "proxyConfiguration": {
                "useApifyProxy": True,
                "apifyProxyGroups": ["RESIDENTIAL"],
                "apifyProxyCountry": "TH"
            },
        }
        run = self.client_review.actor("getdataforme/lazada-product-review-scraper").call(
            run_input=run_input
        )

        product_reviews = []
        print("💾 Check your data here: https://console.apify.com/storage/datasets/" + run["defaultDatasetId"])
        for item in self.client_review.dataset(run["defaultDatasetId"]).iterate_items():
            print(item)
            product_reviews.append(item)
        return product_reviews