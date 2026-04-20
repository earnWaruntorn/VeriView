from apify_client import ApifyClient

# Initialize the ApifyClient with your Apify API token
# Replace '<YOUR_API_TOKEN>' with your token.
client = ApifyClient("")

# Prepare the Actor input
run_input = {
    "scrape_type": "specific_product_urls",   # ✅ REQUIRED

    "urls": [
        "https://www.lazada.co.th/products/pdp-i6060583359-s26296570135.html"
    ],

    "ignore_url_failures": True,

    # ❌ remove max_items_per_url (not used for product URLs)

    "max_retries_per_url": 5,   # ✅ increase retry

    "proxy": {
        "useApifyProxy": True,
        "apifyProxyGroups": ["RESIDENTIAL"],
        "apifyProxyCountry": "TH",   # 🔥 MOST IMPORTANT
    },
}

# Run the Actor and wait for it to finish
run = client.actor("ecomscrape/lazada-product-scraper-rental").call(run_input=run_input)

# Fetch and print Actor results from the run's dataset (if there are any)
product_info = []
print("💾 Check your data here: https://console.apify.com/storage/datasets/" + run["defaultDatasetId"])
for item in client.dataset(run["defaultDatasetId"]).iterate_items():
    print(item)
    product_info.append(item)
print(product_info[0])

# 📚 Want to learn more 📖? Go to → https://docs.apify.com/api/client/python/docs/quick-start