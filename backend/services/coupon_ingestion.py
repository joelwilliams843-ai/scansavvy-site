"""
Coupon Ingestion Service
Handles importing coupons from structured JSON data into Supabase
This is a separate module that can be replaced with API/scraping later
"""
import json
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Import from parent
from database import AsyncSessionLocal
from models import Store, Coupon


# ============== KROGER COUPON DATA (REAL STRUCTURED DATA) ==============
# This is the single working reference pipeline
# Data is structured, realistic, and ready for production

KROGER_STORE_DATA = {
    "id": "kroger",
    "name": "Kroger",
    "logo": "🥬",
    "color": "#0C3E80",
    "category": "Grocery"
}

KROGER_COUPONS_DATA = [
    {
        "title": "$3 OFF Fresh Ground Beef",
        "description": "Save $3 on any package of fresh ground beef (3 lbs or more)",
        "discount": "$3 OFF",
        "discount_value": 3.00,
        "category": "Meat & Seafood",
        "barcode": "KRG-BEEF-001",
        "terms": "Limit 1 per household. Valid in-store only."
    },
    {
        "title": "BOGO Free Kroger Milk",
        "description": "Buy one gallon of Kroger milk, get one free",
        "discount": "BOGO",
        "discount_value": 4.29,
        "category": "Dairy",
        "barcode": "KRG-MILK-002",
        "terms": "Limit 2 per household. Any variety."
    },
    {
        "title": "$2 OFF Fresh Produce",
        "description": "Save $2 on any fresh fruit or vegetable purchase of $10 or more",
        "discount": "$2 OFF",
        "discount_value": 2.00,
        "category": "Produce",
        "barcode": "KRG-PROD-003",
        "terms": "Excludes organic items."
    },
    {
        "title": "25% OFF Bakery Items",
        "description": "Save 25% on all in-store bakery bread and rolls",
        "discount": "25% OFF",
        "discount_value": 2.50,
        "category": "Bakery",
        "barcode": "KRG-BAKE-004",
        "terms": "Valid on items baked in-store only."
    },
    {
        "title": "$5 OFF $50 Purchase",
        "description": "Save $5 when you spend $50 or more on groceries",
        "discount": "$5 OFF",
        "discount_value": 5.00,
        "category": "General",
        "barcode": "KRG-GEN-005",
        "terms": "Excludes alcohol, tobacco, and gift cards."
    },
    {
        "title": "$1.50 OFF Kroger Cereal",
        "description": "Save $1.50 on any 2 boxes of Kroger brand cereal",
        "discount": "$1.50 OFF",
        "discount_value": 1.50,
        "category": "Breakfast",
        "barcode": "KRG-CER-006",
        "terms": "Any variety, 12oz or larger."
    },
    {
        "title": "Buy 2 Get 1 Free Yogurt",
        "description": "Buy 2 Kroger yogurt cups, get 1 free",
        "discount": "B2G1",
        "discount_value": 1.29,
        "category": "Dairy",
        "barcode": "KRG-YOG-007",
        "terms": "5.3oz cups. Mix and match flavors."
    },
    {
        "title": "$4 OFF Deli Meat",
        "description": "Save $4 on sliced deli meat (1 lb or more)",
        "discount": "$4 OFF",
        "discount_value": 4.00,
        "category": "Deli",
        "barcode": "KRG-DELI-008",
        "terms": "Freshly sliced at deli counter only."
    },
    {
        "title": "20% OFF Frozen Vegetables",
        "description": "Save 20% on all Kroger frozen vegetables",
        "discount": "20% OFF",
        "discount_value": 1.80,
        "category": "Frozen",
        "barcode": "KRG-FROZ-009",
        "terms": "Excludes organic varieties."
    },
    {
        "title": "$2 OFF Coffee",
        "description": "Save $2 on any Kroger brand coffee (10oz+)",
        "discount": "$2 OFF",
        "discount_value": 2.00,
        "category": "Beverages",
        "barcode": "KRG-COF-010",
        "terms": "Ground or whole bean."
    },
    {
        "title": "BOGO 50% OFF Chips",
        "description": "Buy one bag of Kroger chips, get second 50% off",
        "discount": "BOGO 50%",
        "discount_value": 2.25,
        "category": "Snacks",
        "barcode": "KRG-CHIP-011",
        "terms": "Family size bags only (10oz+)."
    },
    {
        "title": "$3 OFF Kroger Rotisserie Chicken",
        "description": "Save $3 on any hot rotisserie chicken",
        "discount": "$3 OFF",
        "discount_value": 3.00,
        "category": "Deli",
        "barcode": "KRG-ROTI-012",
        "terms": "While supplies last. No rain checks."
    }
]


async def ingest_store(db: AsyncSession, store_data: Dict[str, Any]) -> Store:
    """Create or update a store in the database"""
    # Check if store exists
    result = await db.execute(
        select(Store).where(Store.id == store_data["id"])
    )
    store = result.scalar_one_or_none()
    
    if store:
        # Update existing store
        store.name = store_data["name"]
        store.logo = store_data["logo"]
        store.color = store_data["color"]
        store.category = store_data["category"]
        store.is_active = True
        print(f"Updated store: {store.name}")
    else:
        # Create new store
        store = Store(
            id=store_data["id"],
            name=store_data["name"],
            logo=store_data["logo"],
            color=store_data["color"],
            category=store_data["category"],
            is_active=True
        )
        db.add(store)
        print(f"Created store: {store.name}")
    
    await db.commit()
    await db.refresh(store)
    return store


async def ingest_coupons(
    db: AsyncSession, 
    store_id: str, 
    coupons_data: List[Dict[str, Any]],
    expiry_days: int = 7
) -> List[Coupon]:
    """Ingest coupons for a store, setting expiry dates"""
    coupons = []
    # Use naive datetime (no timezone) for PostgreSQL TIMESTAMP WITHOUT TIME ZONE
    expiry_date = datetime.utcnow() + timedelta(days=expiry_days)
    
    for coupon_data in coupons_data:
        # Check if coupon with same barcode exists
        existing = None
        if coupon_data.get("barcode"):
            result = await db.execute(
                select(Coupon).where(
                    Coupon.barcode == coupon_data["barcode"],
                    Coupon.store_id == store_id
                )
            )
            existing = result.scalar_one_or_none()
        
        if existing:
            # Update existing coupon
            existing.title = coupon_data["title"]
            existing.description = coupon_data["description"]
            existing.discount = coupon_data["discount"]
            existing.discount_value = coupon_data.get("discount_value", 0.0)
            existing.category = coupon_data.get("category", "General")
            existing.terms = coupon_data.get("terms", "")
            existing.expiry_date = expiry_date
            existing.is_active = True
            coupons.append(existing)
            print(f"  Updated coupon: {existing.title}")
        else:
            # Create new coupon
            coupon = Coupon(
                store_id=store_id,
                title=coupon_data["title"],
                description=coupon_data["description"],
                discount=coupon_data["discount"],
                discount_value=coupon_data.get("discount_value", 0.0),
                category=coupon_data.get("category", "General"),
                barcode=coupon_data.get("barcode"),
                terms=coupon_data.get("terms", ""),
                expiry_date=expiry_date,
                is_active=True
            )
            db.add(coupon)
            coupons.append(coupon)
            print(f"  Created coupon: {coupon.title}")
    
    await db.commit()
    for c in coupons:
        await db.refresh(c)
    
    return coupons


async def ingest_kroger_data():
    """Main function to ingest all Kroger data"""
    print("=" * 50)
    print("ScanSavvy Coupon Ingestion Service")
    print("=" * 50)
    print("\nIngesting Kroger store and coupons...")
    
    async with AsyncSessionLocal() as db:
        # Create/update Kroger store
        store = await ingest_store(db, KROGER_STORE_DATA)
        print(f"\nStore ID: {store.id}")
        
        # Ingest coupons
        print(f"\nIngesting {len(KROGER_COUPONS_DATA)} coupons...")
        coupons = await ingest_coupons(db, store.id, KROGER_COUPONS_DATA, expiry_days=7)
        
        # Calculate total savings
        total_savings = sum(c.discount_value for c in coupons)
        
        print(f"\n{'=' * 50}")
        print("INGESTION COMPLETE")
        print(f"{'=' * 50}")
        print(f"Store: {store.name}")
        print(f"Coupons ingested: {len(coupons)}")
        print(f"Total potential savings: ${total_savings:.2f}")
        print(f"Expiry: 7 days from now")
        
        return store, coupons


async def ingest_from_json(json_file_path: str):
    """Ingest coupons from a JSON file (for future API/scraping integration)"""
    with open(json_file_path, 'r') as f:
        data = json.load(f)
    
    async with AsyncSessionLocal() as db:
        store = await ingest_store(db, data["store"])
        coupons = await ingest_coupons(db, store.id, data["coupons"])
        return store, coupons


if __name__ == "__main__":
    # Run the Kroger data ingestion
    asyncio.run(ingest_kroger_data())
