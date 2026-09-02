import os, stripe
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent / ".env")

stripe.api_key = os.environ["STRIPE_SECRET_KEY"]

CATALOG = [{
    "emergent_product_id": "ordre_subscription",
    "name": "MySolaia \u2014 Abonnement",
    "tax_code": "txcd_10103001",
    "prices": [
        {"lookup_key": "ordre_monthly", "amount": 499, "currency": "cad", "interval": "month"},
        {"lookup_key": "ordre_yearly", "amount": 3999, "currency": "cad", "interval": "year"},
    ],
}]

def get_or_create_product(entry):
    for p in stripe.Product.list(active=True).auto_paging_iter():
        if p.to_dict().get("metadata", {}).get("emergent_product_id") == entry["emergent_product_id"]:
            return p
    return stripe.Product.create(name=entry["name"], tax_code=entry.get("tax_code"),
        metadata={"managed_by": "emergent", "emergent_product_id": entry["emergent_product_id"]})

for entry in CATALOG:
    product = get_or_create_product(entry)
    for pr in entry["prices"]:
        existing = stripe.Price.list(lookup_keys=[pr["lookup_key"]], active=True, limit=1).data
        if existing and (existing[0].unit_amount != pr["amount"] or existing[0].currency != pr["currency"]):
            stripe.Price.modify(existing[0].id, active=False)
            existing = []
        if not existing:
            stripe.Price.create(product=product.id, unit_amount=pr["amount"], currency=pr["currency"],
                lookup_key=pr["lookup_key"], transfer_lookup_key=True,
                recurring={"interval": pr["interval"]})
            print("created", pr["lookup_key"])
        else:
            print("exists", pr["lookup_key"])
print("done")
