from apify_client import ApifyClient

# Initialize the ApifyClient with your Apify API token
# Replace '<YOUR_API_TOKEN>' with your token.
client = ApifyClient("api-key")

# Prepare the Actor input
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
  "urls": ["https://www.lazada.co.th/products/pdp-i6060583359-s26296570135.html"]
}

# Run the Actor and wait for it to finish
run = client.actor("ecomscrape/lazada-product-scraper").call(run_input=run_input)

# Fetch and print Actor results from the run's dataset (if there are any)
print("💾 Check your data here: https://console.apify.com/storage/datasets/" + run["defaultDatasetId"])
for item in client.dataset(run["defaultDatasetId"]).iterate_items():
    print(item)

# 📚 Want to learn more 📖? Go to → https://docs.apify.com/api/client/python/docs/quick-start