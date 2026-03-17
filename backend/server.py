from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import hashlib
import random
import json
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Scheduler for weekly bundle generation
scheduler = AsyncIOScheduler()

# ============== MODELS ==============

class UserCreate(BaseModel):
    email: str
    name: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    selected_stores: List[str] = []
    manufacturer_coupons_enabled: bool = False
    notification_method: str = "push"
    tier: str = "free"  # "free" or "premium"
    created_at: str
    location_zip: Optional[str] = None

class StoreSelectionUpdate(BaseModel):
    store_ids: List[str]

class ManufacturerCouponsToggle(BaseModel):
    enabled: bool

class NotificationMethodUpdate(BaseModel):
    method: str

class LocationUpdate(BaseModel):
    zip_code: str

class CouponViewEvent(BaseModel):
    coupon_id: str
    store_id: Optional[str] = None

# ============== CURATED COUPON DATA (API-READY STRUCTURE) ==============
# This structure is designed to be easily replaced with a real coupon API
# Each coupon has: id, store_id, title, description, savings_value, savings_type, category, brand, expiry_days

CURATED_COUPONS = {
    "walmart": [
        {"id": "wm-001", "store_id": "walmart", "title": "$5 OFF $50+ Grocery Purchase", "description": "Save $5 on your grocery order of $50 or more", "savings_value": 5.00, "savings_type": "dollar", "category": "grocery", "brand": None, "expiry_days": 7},
        {"id": "wm-002", "store_id": "walmart", "title": "20% OFF Household Essentials", "description": "Save 20% on cleaning supplies, paper goods, and more", "savings_value": 20, "savings_type": "percent", "category": "household", "brand": None, "expiry_days": 7},
        {"id": "wm-003", "store_id": "walmart", "title": "$3 OFF Tide Laundry Detergent", "description": "Save $3 on any Tide product 92oz or larger", "savings_value": 3.00, "savings_type": "dollar", "category": "household", "brand": "Tide", "expiry_days": 7},
        {"id": "wm-004", "store_id": "walmart", "title": "BOGO 50% OFF Snacks", "description": "Buy one get one 50% off select chips and snacks", "savings_value": 50, "savings_type": "bogo", "category": "snacks", "brand": None, "expiry_days": 7},
        {"id": "wm-005", "store_id": "walmart", "title": "$2 OFF Coca-Cola 12-Pack", "description": "Save $2 on any Coca-Cola 12-pack", "savings_value": 2.00, "savings_type": "dollar", "category": "beverages", "brand": "Coca-Cola", "expiry_days": 7},
        {"id": "wm-006", "store_id": "walmart", "title": "15% OFF Baby Products", "description": "Save 15% on diapers, wipes, and baby care", "savings_value": 15, "savings_type": "percent", "category": "baby", "brand": None, "expiry_days": 7},
        {"id": "wm-007", "store_id": "walmart", "title": "$10 OFF $75+ Purchase", "description": "Save $10 on orders of $75 or more", "savings_value": 10.00, "savings_type": "dollar", "category": "general", "brand": None, "expiry_days": 7},
    ],
    "target": [
        {"id": "tgt-001", "store_id": "target", "title": "25% OFF Home Decor", "description": "Save 25% on select home decor items", "savings_value": 25, "savings_type": "percent", "category": "home", "brand": None, "expiry_days": 7},
        {"id": "tgt-002", "store_id": "target", "title": "$5 OFF $25+ Beauty Purchase", "description": "Save $5 on beauty products of $25 or more", "savings_value": 5.00, "savings_type": "dollar", "category": "beauty", "brand": None, "expiry_days": 7},
        {"id": "tgt-003", "store_id": "target", "title": "Buy 2 Get 1 Free - Books", "description": "Buy 2 books, get 1 free on select titles", "savings_value": 100, "savings_type": "bogo", "category": "books", "brand": None, "expiry_days": 7},
        {"id": "tgt-004", "store_id": "target", "title": "20% OFF Clothing", "description": "Save 20% on all apparel and accessories", "savings_value": 20, "savings_type": "percent", "category": "clothing", "brand": None, "expiry_days": 7},
        {"id": "tgt-005", "store_id": "target", "title": "$3 OFF Starbucks Coffee", "description": "Save $3 on any Starbucks coffee bag", "savings_value": 3.00, "savings_type": "dollar", "category": "beverages", "brand": "Starbucks", "expiry_days": 7},
        {"id": "tgt-006", "store_id": "target", "title": "15% OFF Kitchen Appliances", "description": "Save 15% on small kitchen appliances", "savings_value": 15, "savings_type": "percent", "category": "kitchen", "brand": None, "expiry_days": 7},
    ],
    "kroger": [
        {"id": "kr-001", "store_id": "kroger", "title": "$1 OFF Kroger Brand Items", "description": "Save $1 on any 3 Kroger brand products", "savings_value": 1.00, "savings_type": "dollar", "category": "grocery", "brand": "Kroger", "expiry_days": 7},
        {"id": "kr-002", "store_id": "kroger", "title": "BOGO Free Cereal", "description": "Buy one get one free on select cereals", "savings_value": 100, "savings_type": "bogo", "category": "breakfast", "brand": None, "expiry_days": 7},
        {"id": "kr-003", "store_id": "kroger", "title": "$2 OFF Fresh Meat", "description": "Save $2 on fresh beef, chicken, or pork", "savings_value": 2.00, "savings_type": "dollar", "category": "meat", "brand": None, "expiry_days": 7},
        {"id": "kr-004", "store_id": "kroger", "title": "30% OFF Produce", "description": "Save 30% on fresh fruits and vegetables", "savings_value": 30, "savings_type": "percent", "category": "produce", "brand": None, "expiry_days": 7},
        {"id": "kr-005", "store_id": "kroger", "title": "$5 OFF $30+ Dairy Purchase", "description": "Save $5 on dairy products of $30 or more", "savings_value": 5.00, "savings_type": "dollar", "category": "dairy", "brand": None, "expiry_days": 7},
    ],
    "cvs": [
        {"id": "cvs-001", "store_id": "cvs", "title": "40% OFF Vitamins", "description": "Save 40% on all vitamins and supplements", "savings_value": 40, "savings_type": "percent", "category": "health", "brand": None, "expiry_days": 7},
        {"id": "cvs-002", "store_id": "cvs", "title": "$5 ExtraBucks on $20+ Purchase", "description": "Get $5 ExtraBucks when you spend $20 or more", "savings_value": 5.00, "savings_type": "dollar", "category": "general", "brand": None, "expiry_days": 7},
        {"id": "cvs-003", "store_id": "cvs", "title": "BOGO 50% OFF Skincare", "description": "Buy one get one 50% off select skincare", "savings_value": 50, "savings_type": "bogo", "category": "beauty", "brand": None, "expiry_days": 7},
        {"id": "cvs-004", "store_id": "cvs", "title": "$3 OFF Tylenol or Advil", "description": "Save $3 on pain relief products", "savings_value": 3.00, "savings_type": "dollar", "category": "health", "brand": None, "expiry_days": 7},
        {"id": "cvs-005", "store_id": "cvs", "title": "25% OFF Photo Prints", "description": "Save 25% on all photo printing services", "savings_value": 25, "savings_type": "percent", "category": "photo", "brand": None, "expiry_days": 7},
    ],
    "walgreens": [
        {"id": "wg-001", "store_id": "walgreens", "title": "$2 OFF Walgreens Brand", "description": "Save $2 on any Walgreens brand product", "savings_value": 2.00, "savings_type": "dollar", "category": "general", "brand": "Walgreens", "expiry_days": 7},
        {"id": "wg-002", "store_id": "walgreens", "title": "30% OFF Cosmetics", "description": "Save 30% on select cosmetics and beauty", "savings_value": 30, "savings_type": "percent", "category": "beauty", "brand": None, "expiry_days": 7},
        {"id": "wg-003", "store_id": "walgreens", "title": "BOGO Free Candy", "description": "Buy one get one free on select candy", "savings_value": 100, "savings_type": "bogo", "category": "snacks", "brand": None, "expiry_days": 7},
        {"id": "wg-004", "store_id": "walgreens", "title": "$5 OFF $25+ Health Purchase", "description": "Save $5 on health products of $25 or more", "savings_value": 5.00, "savings_type": "dollar", "category": "health", "brand": None, "expiry_days": 7},
    ],
    "costco": [
        {"id": "cc-001", "store_id": "costco", "title": "$10 OFF $100+ Purchase", "description": "Save $10 on orders of $100 or more", "savings_value": 10.00, "savings_type": "dollar", "category": "general", "brand": None, "expiry_days": 7},
        {"id": "cc-002", "store_id": "costco", "title": "$5 OFF Kirkland Products", "description": "Save $5 on any 2 Kirkland Signature items", "savings_value": 5.00, "savings_type": "dollar", "category": "general", "brand": "Kirkland", "expiry_days": 7},
        {"id": "cc-003", "store_id": "costco", "title": "15% OFF Electronics", "description": "Save 15% on select electronics", "savings_value": 15, "savings_type": "percent", "category": "electronics", "brand": None, "expiry_days": 7},
        {"id": "cc-004", "store_id": "costco", "title": "$3 OFF Rotisserie Chicken", "description": "Save $3 on Costco rotisserie chicken", "savings_value": 3.00, "savings_type": "dollar", "category": "deli", "brand": None, "expiry_days": 7},
    ],
    "publix": [
        {"id": "pb-001", "store_id": "publix", "title": "BOGO Free Publix Ice Cream", "description": "Buy one get one free on Publix brand ice cream", "savings_value": 100, "savings_type": "bogo", "category": "frozen", "brand": "Publix", "expiry_days": 7},
        {"id": "pb-002", "store_id": "publix", "title": "$2 OFF Deli Meats", "description": "Save $2 on sliced deli meats", "savings_value": 2.00, "savings_type": "dollar", "category": "deli", "brand": None, "expiry_days": 7},
        {"id": "pb-003", "store_id": "publix", "title": "20% OFF Bakery Items", "description": "Save 20% on fresh bakery products", "savings_value": 20, "savings_type": "percent", "category": "bakery", "brand": None, "expiry_days": 7},
        {"id": "pb-004", "store_id": "publix", "title": "$5 OFF $40+ Purchase", "description": "Save $5 on orders of $40 or more", "savings_value": 5.00, "savings_type": "dollar", "category": "general", "brand": None, "expiry_days": 7},
    ],
    "aldi": [
        {"id": "al-001", "store_id": "aldi", "title": "$3 OFF $30+ Purchase", "description": "Save $3 on orders of $30 or more", "savings_value": 3.00, "savings_type": "dollar", "category": "general", "brand": None, "expiry_days": 7},
        {"id": "al-002", "store_id": "aldi", "title": "20% OFF Fresh Produce", "description": "Save 20% on all fruits and vegetables", "savings_value": 20, "savings_type": "percent", "category": "produce", "brand": None, "expiry_days": 7},
        {"id": "al-003", "store_id": "aldi", "title": "$1 OFF Aldi Finds", "description": "Save $1 on weekly Aldi Finds items", "savings_value": 1.00, "savings_type": "dollar", "category": "general", "brand": None, "expiry_days": 7},
    ],
    "safeway": [
        {"id": "sw-001", "store_id": "safeway", "title": "$5 OFF $50+ Purchase", "description": "Save $5 on orders of $50 or more", "savings_value": 5.00, "savings_type": "dollar", "category": "general", "brand": None, "expiry_days": 7},
        {"id": "sw-002", "store_id": "safeway", "title": "BOGO Free Bread", "description": "Buy one get one free on select breads", "savings_value": 100, "savings_type": "bogo", "category": "bakery", "brand": None, "expiry_days": 7},
        {"id": "sw-003", "store_id": "safeway", "title": "25% OFF Organic Products", "description": "Save 25% on O Organics items", "savings_value": 25, "savings_type": "percent", "category": "organic", "brand": "O Organics", "expiry_days": 7},
    ],
    "whole-foods": [
        {"id": "wf-001", "store_id": "whole-foods", "title": "20% OFF Prime Member Deals", "description": "Save 20% on weekly Prime member specials", "savings_value": 20, "savings_type": "percent", "category": "general", "brand": None, "expiry_days": 7},
        {"id": "wf-002", "store_id": "whole-foods", "title": "$3 OFF 365 Brand Items", "description": "Save $3 on any 3 365 by Whole Foods products", "savings_value": 3.00, "savings_type": "dollar", "category": "general", "brand": "365", "expiry_days": 7},
        {"id": "wf-003", "store_id": "whole-foods", "title": "15% OFF Supplements", "description": "Save 15% on vitamins and supplements", "savings_value": 15, "savings_type": "percent", "category": "health", "brand": None, "expiry_days": 7},
    ],
}

# Manufacturer coupons (work at any store)
MANUFACTURER_COUPONS = [
    {"id": "mfr-001", "store_id": None, "title": "$2 OFF Tide Pods", "description": "Save $2 on any Tide Pods 42ct or larger", "savings_value": 2.00, "savings_type": "dollar", "category": "household", "brand": "Tide", "expiry_days": 14},
    {"id": "mfr-002", "store_id": None, "title": "$1.50 OFF Bounty Paper Towels", "description": "Save $1.50 on Bounty paper towels 6-roll or larger", "savings_value": 1.50, "savings_type": "dollar", "category": "household", "brand": "Bounty", "expiry_days": 14},
    {"id": "mfr-003", "store_id": None, "title": "$3 OFF Pampers Diapers", "description": "Save $3 on any Pampers diapers box", "savings_value": 3.00, "savings_type": "dollar", "category": "baby", "brand": "Pampers", "expiry_days": 14},
    {"id": "mfr-004", "store_id": None, "title": "$2 OFF Coca-Cola Products", "description": "Save $2 on any 2 Coca-Cola 12-packs", "savings_value": 2.00, "savings_type": "dollar", "category": "beverages", "brand": "Coca-Cola", "expiry_days": 14},
    {"id": "mfr-005", "store_id": None, "title": "$1 OFF Kraft Mac & Cheese", "description": "Save $1 on any 3 Kraft Mac & Cheese boxes", "savings_value": 1.00, "savings_type": "dollar", "category": "grocery", "brand": "Kraft", "expiry_days": 14},
    {"id": "mfr-006", "store_id": None, "title": "$2.50 OFF General Mills Cereal", "description": "Save $2.50 on any 2 General Mills cereals", "savings_value": 2.50, "savings_type": "dollar", "category": "breakfast", "brand": "General Mills", "expiry_days": 14},
    {"id": "mfr-007", "store_id": None, "title": "$1.50 OFF Colgate Toothpaste", "description": "Save $1.50 on Colgate Total toothpaste", "savings_value": 1.50, "savings_type": "dollar", "category": "health", "brand": "Colgate", "expiry_days": 14},
    {"id": "mfr-008", "store_id": None, "title": "$3 OFF Dove Body Wash", "description": "Save $3 on Dove body wash 22oz or larger", "savings_value": 3.00, "savings_type": "dollar", "category": "beauty", "brand": "Dove", "expiry_days": 14},
]

STORES = [
    {"id": "walmart", "name": "Walmart", "logo": "🛒", "color": "#0071DC", "category": "Superstore"},
    {"id": "target", "name": "Target", "logo": "🎯", "color": "#CC0000", "category": "Superstore"},
    {"id": "kroger", "name": "Kroger", "logo": "🥬", "color": "#0C3E80", "category": "Grocery"},
    {"id": "publix", "name": "Publix", "logo": "🛍️", "color": "#3B8C3B", "category": "Grocery"},
    {"id": "walgreens", "name": "Walgreens", "logo": "💊", "color": "#E31837", "category": "Pharmacy"},
    {"id": "cvs", "name": "CVS", "logo": "💊", "color": "#CC0000", "category": "Pharmacy"},
    {"id": "costco", "name": "Costco", "logo": "📦", "color": "#E31837", "category": "Wholesale"},
    {"id": "sams-club", "name": "Sam's Club", "logo": "📦", "color": "#0067A0", "category": "Wholesale"},
    {"id": "aldi", "name": "Aldi", "logo": "🛒", "color": "#00529B", "category": "Grocery"},
    {"id": "dollar-general", "name": "Dollar General", "logo": "💵", "color": "#FFC220", "category": "Discount"},
    {"id": "dollar-tree", "name": "Dollar Tree", "logo": "🌳", "color": "#00A651", "category": "Discount"},
    {"id": "safeway", "name": "Safeway", "logo": "🥗", "color": "#E8322E", "category": "Grocery"},
    {"id": "whole-foods", "name": "Whole Foods", "logo": "🥑", "color": "#00674B", "category": "Grocery"},
    {"id": "trader-joes", "name": "Trader Joe's", "logo": "🌺", "color": "#C8102E", "category": "Grocery"},
    {"id": "wegmans", "name": "Wegmans", "logo": "🍎", "color": "#D91F2A", "category": "Grocery"},
    {"id": "heb", "name": "H-E-B", "logo": "⭐", "color": "#EE3124", "category": "Grocery"},
    {"id": "meijer", "name": "Meijer", "logo": "🛒", "color": "#D51317", "category": "Superstore"},
    {"id": "rite-aid", "name": "Rite Aid", "logo": "💊", "color": "#004B87", "category": "Pharmacy"},
    {"id": "food-lion", "name": "Food Lion", "logo": "🦁", "color": "#E03A3E", "category": "Grocery"},
    {"id": "stop-shop", "name": "Stop & Shop", "logo": "🛑", "color": "#D31145", "category": "Grocery"},
]

# ============== HELPER FUNCTIONS ==============

def get_week_boundaries():
    """Get the start and end of the current week (Sunday to Saturday)"""
    now = datetime.now(timezone.utc)
    # Find the most recent Sunday
    days_since_sunday = (now.weekday() + 1) % 7
    week_start = now - timedelta(days=days_since_sunday)
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)
    return week_start, week_end

def get_next_sunday():
    """Get the next Sunday at midnight"""
    now = datetime.now(timezone.utc)
    days_until_sunday = (6 - now.weekday()) % 7
    if days_until_sunday == 0 and now.hour >= 0:
        days_until_sunday = 7
    next_sunday = now + timedelta(days=days_until_sunday)
    return next_sunday.replace(hour=0, minute=0, second=0, microsecond=0)

def calculate_total_savings(coupons: List[dict]) -> float:
    """Calculate estimated total savings from coupons"""
    total = 0.0
    for coupon in coupons:
        if coupon["savings_type"] == "dollar":
            total += coupon["savings_value"]
        elif coupon["savings_type"] == "percent":
            # Estimate: assume $20 average item price
            total += (coupon["savings_value"] / 100) * 20
        elif coupon["savings_type"] == "bogo":
            # Estimate: assume $5 average item saved
            total += 5.0
    return round(total, 2)

def generate_bundle_id() -> str:
    """Generate a unique bundle ID"""
    return str(uuid.uuid4())[:12].upper()

def generate_qr_url(bundle_id: str, base_url: str) -> str:
    """Generate the URL that the QR code will link to"""
    return f"{base_url}/api/bundle/{bundle_id}/view"

async def get_coupons_for_stores(store_ids: List[str], include_manufacturer: bool = True) -> List[dict]:
    """Get all coupons for the given stores"""
    coupons = []
    for store_id in store_ids:
        if store_id in CURATED_COUPONS:
            coupons.extend(CURATED_COUPONS[store_id])
    
    if include_manufacturer:
        coupons.extend(MANUFACTURER_COUPONS)
    
    return coupons

async def generate_master_bundle(user_id: str, is_starter: bool = False) -> dict:
    """Generate a single master bundle containing all coupons for user's selected stores"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return None
    
    # Get week boundaries
    week_start, week_end = get_week_boundaries()
    now = datetime.now(timezone.utc)
    
    # For starter bundles (midweek signups), valid until next Sunday
    if is_starter:
        next_sunday = get_next_sunday()
        valid_until = next_sunday
        bundle_type = "starter"
    else:
        valid_until = week_end
        bundle_type = "weekly"
    
    # Get coupons for user's selected stores
    coupons = await get_coupons_for_stores(
        user.get("selected_stores", []),
        user.get("manufacturer_coupons_enabled", False)
    )
    
    # Calculate totals
    total_savings = calculate_total_savings(coupons)
    stores_included = list(set(c["store_id"] for c in coupons if c["store_id"]))
    
    # Generate bundle
    bundle_id = generate_bundle_id()
    
    bundle = {
        "id": bundle_id,
        "user_id": user_id,
        "bundle_type": bundle_type,
        "coupons": coupons,
        "coupon_count": len(coupons),
        "total_savings": total_savings,
        "stores_included": stores_included,
        "manufacturer_coupons_included": user.get("manufacturer_coupons_enabled", False),
        "week_label": week_start.strftime("Week of %B %d"),
        "valid_from": now.isoformat(),
        "valid_until": valid_until.isoformat(),
        "created_at": now.isoformat(),
        "is_active": True
    }
    
    # Deactivate any previous active bundles for this user
    await db.bundles.update_many(
        {"user_id": user_id, "is_active": True},
        {"$set": {"is_active": False}}
    )
    
    # Save bundle to database
    await db.bundles.insert_one(bundle)
    
    return bundle

async def generate_weekly_bundles_for_all_users():
    """Cron job: Generate weekly bundles for all users"""
    logger.info("Starting weekly bundle generation...")
    users = await db.users.find({}, {"_id": 0, "id": 1}).to_list(length=None)
    
    for user in users:
        try:
            await generate_master_bundle(user["id"], is_starter=False)
            logger.info(f"Generated weekly bundle for user {user['id']}")
        except Exception as e:
            logger.error(f"Failed to generate bundle for user {user['id']}: {e}")
    
    logger.info(f"Weekly bundle generation complete. Processed {len(users)} users.")

# ============== API ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "ScanSavvy API", "version": "2.0.0"}

@api_router.get("/stores")
async def get_stores(search: Optional[str] = None, category: Optional[str] = None):
    """Get all available stores with optional filtering"""
    stores = STORES.copy()
    
    if search:
        search_lower = search.lower()
        stores = [s for s in stores if search_lower in s["name"].lower()]
    
    if category:
        stores = [s for s in stores if s["category"].lower() == category.lower()]
    
    return {"stores": stores}

@api_router.get("/stores/categories")
async def get_store_categories():
    """Get unique store categories"""
    categories = list(set(s["category"] for s in STORES))
    return {"categories": sorted(categories)}

@api_router.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate):
    """Create a new user"""
    existing = await db.users.find_one({"email": user.email}, {"_id": 0})
    if existing:
        return UserResponse(**existing)
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user.email,
        "name": user.name,
        "selected_stores": [],
        "manufacturer_coupons_enabled": False,
        "notification_method": "push",
        "tier": "free",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "location_zip": None,
        "behavior": {
            "coupons_viewed": [],
            "stores_interacted": [],
            "categories_preferred": []
        }
    }
    
    await db.users.insert_one(user_doc)
    if "_id" in user_doc:
        del user_doc["_id"]
    return UserResponse(**user_doc)

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """Get user by ID"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**user)

@api_router.put("/users/{user_id}/stores")
async def update_user_stores(user_id: str, update: StoreSelectionUpdate):
    """Update user's selected stores and generate new bundle"""
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"selected_stores": update.store_ids}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user needs a starter bundle (first time selecting stores)
    existing_bundle = await db.bundles.find_one({"user_id": user_id, "is_active": True}, {"_id": 0})
    if not existing_bundle:
        # Generate starter bundle for new user
        await generate_master_bundle(user_id, is_starter=True)
    else:
        # Regenerate bundle with new stores
        await generate_master_bundle(user_id, is_starter=False)
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    return UserResponse(**user)

@api_router.put("/users/{user_id}/manufacturer-coupons")
async def toggle_manufacturer_coupons(user_id: str, update: ManufacturerCouponsToggle):
    """Toggle manufacturer coupons for user"""
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"manufacturer_coupons_enabled": update.enabled}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Regenerate bundle with updated preference
    await generate_master_bundle(user_id, is_starter=False)
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    return UserResponse(**user)

@api_router.put("/users/{user_id}/notification-method")
async def update_notification_method(user_id: str, update: NotificationMethodUpdate):
    """Update user's notification method"""
    if update.method not in ["sms", "push", "email"]:
        raise HTTPException(status_code=400, detail="Invalid notification method")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"notification_method": update.method}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    return UserResponse(**user)

@api_router.put("/users/{user_id}/location")
async def update_user_location(user_id: str, update: LocationUpdate):
    """Update user's location (ZIP code)"""
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"location_zip": update.zip_code}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    return UserResponse(**user)

# ============== MASTER BUNDLE ENDPOINTS ==============

@api_router.get("/users/{user_id}/bundle")
async def get_user_bundle(user_id: str, request: Request):
    """Get the user's active master bundle"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get active bundle
    bundle = await db.bundles.find_one(
        {"user_id": user_id, "is_active": True},
        {"_id": 0}
    )
    
    # If no bundle exists, generate a starter bundle
    if not bundle:
        if len(user.get("selected_stores", [])) > 0:
            bundle = await generate_master_bundle(user_id, is_starter=True)
        else:
            return {
                "has_bundle": False,
                "message": "No stores selected. Please select stores to get your coupon bundle."
            }
    
    # Generate QR URL
    base_url = str(request.base_url).rstrip("/")
    qr_url = generate_qr_url(bundle["id"], base_url)
    
    # Get store details for included stores
    stores_details = [s for s in STORES if s["id"] in bundle.get("stores_included", [])]
    
    return {
        "has_bundle": True,
        "bundle": {
            "id": bundle["id"],
            "qr_url": qr_url,
            "week_label": bundle["week_label"],
            "valid_until": bundle["valid_until"],
            "coupon_count": bundle["coupon_count"],
            "total_savings": bundle["total_savings"],
            "stores_included": stores_details,
            "manufacturer_coupons_included": bundle.get("manufacturer_coupons_included", False),
            "bundle_type": bundle.get("bundle_type", "weekly"),
            "coupons": bundle["coupons"]
        }
    }

@api_router.post("/users/{user_id}/bundle/refresh")
async def refresh_user_bundle(user_id: str, request: Request):
    """Refresh/regenerate the user's bundle (for paid users)"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user is on paid tier (for production, enforce this)
    # For MVP, allow refresh for all users
    
    bundle = await generate_master_bundle(user_id, is_starter=False)
    
    base_url = str(request.base_url).rstrip("/")
    qr_url = generate_qr_url(bundle["id"], base_url)
    stores_details = [s for s in STORES if s["id"] in bundle.get("stores_included", [])]
    
    return {
        "success": True,
        "bundle": {
            "id": bundle["id"],
            "qr_url": qr_url,
            "week_label": bundle["week_label"],
            "valid_until": bundle["valid_until"],
            "coupon_count": bundle["coupon_count"],
            "total_savings": bundle["total_savings"],
            "stores_included": stores_details,
            "coupons": bundle["coupons"]
        }
    }

# ============== PUBLIC QR SCAN PAGE ==============

@api_router.get("/bundle/{bundle_id}/view", response_class=HTMLResponse)
async def view_bundle_page(bundle_id: str):
    """Public page that displays when QR code is scanned"""
    bundle = await db.bundles.find_one({"id": bundle_id}, {"_id": 0})
    
    if not bundle:
        return HTMLResponse(content="""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bundle Not Found - ScanSavvy</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .container { background: white; border-radius: 16px; padding: 40px; text-align: center; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                h1 { color: #1C2B3A; margin-bottom: 16px; }
                p { color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Bundle Not Found</h1>
                <p>This coupon bundle may have expired or is no longer available.</p>
            </div>
        </body>
        </html>
        """, status_code=404)
    
    # Check if bundle is expired
    valid_until = datetime.fromisoformat(bundle["valid_until"].replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)
    is_expired = now > valid_until
    
    # Get user info
    user = await db.users.find_one({"id": bundle["user_id"]}, {"_id": 0, "name": 1})
    user_name = user.get("name", "User") if user else "User"
    
    # Build coupon HTML
    coupons_html = ""
    for coupon in bundle["coupons"]:
        store_name = coupon.get("store_id", "Manufacturer").replace("-", " ").title() if coupon.get("store_id") else "Manufacturer Coupon"
        savings_display = f"${coupon['savings_value']}" if coupon["savings_type"] == "dollar" else f"{coupon['savings_value']}% OFF" if coupon["savings_type"] == "percent" else "BOGO"
        
        coupons_html += f"""
        <div class="coupon">
            <div class="coupon-header">
                <span class="store-name">{store_name}</span>
                <span class="savings">{savings_display}</span>
            </div>
            <div class="coupon-title">{coupon['title']}</div>
            <div class="coupon-desc">{coupon['description']}</div>
        </div>
        """
    
    # Expired banner
    expired_banner = '<div class="expired-banner">⚠️ This bundle has expired</div>' if is_expired else ''
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ScanSavvy Coupon Bundle</title>
        <style>
            * {{ box-sizing: border-box; margin: 0; padding: 0; }}
            body {{ 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                background: linear-gradient(135deg, #1F2A44 0%, #2E3B5A 100%);
                min-height: 100vh;
                padding: 20px;
            }}
            .container {{ 
                max-width: 500px; 
                margin: 0 auto;
            }}
            .header {{
                background: white;
                border-radius: 16px 16px 0 0;
                padding: 24px;
                text-align: center;
            }}
            .logo {{
                font-size: 28px;
                font-weight: 700;
                color: #1F2A44;
                margin-bottom: 8px;
            }}
            .logo span {{ color: #1F2A44; }}
            .user-name {{
                color: #666;
                font-size: 14px;
            }}
            .bundle-info {{
                background: #f8f9fa;
                padding: 20px 24px;
            }}
            .week-label {{
                font-size: 18px;
                font-weight: 600;
                color: #1F2A44;
                margin-bottom: 4px;
            }}
            .valid-until {{
                color: #666;
                font-size: 14px;
                margin-bottom: 16px;
            }}
            .stats {{
                display: flex;
                gap: 16px;
            }}
            .stat {{
                flex: 1;
                background: white;
                border-radius: 12px;
                padding: 16px;
                text-align: center;
            }}
            .stat-value {{
                font-size: 24px;
                font-weight: 700;
                color: #1F2A44;
            }}
            .stat-label {{
                font-size: 12px;
                color: #666;
                margin-top: 4px;
            }}
            .coupons {{
                background: white;
                border-radius: 0 0 16px 16px;
                padding: 16px;
            }}
            .coupons-title {{
                font-size: 16px;
                font-weight: 600;
                color: #1F2A44;
                margin-bottom: 16px;
                padding: 0 8px;
            }}
            .coupon {{
                background: #f8f9fa;
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 12px;
                border-left: 4px solid #1F2A44;
            }}
            .coupon:last-child {{ margin-bottom: 0; }}
            .coupon-header {{
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }}
            .store-name {{
                font-size: 12px;
                color: #1F2A44;
                font-weight: 600;
                text-transform: uppercase;
            }}
            .savings {{
                background: #1F2A44;
                color: white;
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
            }}
            .coupon-title {{
                font-size: 16px;
                font-weight: 600;
                color: #1F2A44;
                margin-bottom: 4px;
            }}
            .coupon-desc {{
                font-size: 14px;
                color: #666;
            }}
            .expired-banner {{
                background: #fee2e2;
                color: #dc2626;
                text-align: center;
                padding: 12px;
                font-weight: 600;
            }}
            .footer {{
                text-align: center;
                padding: 24px;
                color: white;
                font-size: 14px;
            }}
            .footer a {{
                color: white;
                text-decoration: underline;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Scan<span>Savvy</span></div>
                <div class="user-name">{user_name}'s Coupon Bundle</div>
            </div>
            {expired_banner}
            <div class="bundle-info">
                <div class="week-label">{bundle['week_label']}</div>
                <div class="valid-until">Valid until {valid_until.strftime('%B %d, %Y')}</div>
                <div class="stats">
                    <div class="stat">
                        <div class="stat-value">{bundle['coupon_count']}</div>
                        <div class="stat-label">Coupons</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${bundle['total_savings']}</div>
                        <div class="stat-label">Est. Savings</div>
                    </div>
                </div>
            </div>
            <div class="coupons">
                <div class="coupons-title">Included Coupons</div>
                {coupons_html}
            </div>
            <div class="footer">
                <p>Powered by <a href="https://scansavvy.app">ScanSavvy</a></p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)

# ============== BEHAVIOR TRACKING ==============

@api_router.post("/users/{user_id}/track/coupon-view")
async def track_coupon_view(user_id: str, event: CouponViewEvent):
    """Track when a user views a coupon"""
    await db.users.update_one(
        {"id": user_id},
        {
            "$push": {
                "behavior.coupons_viewed": {
                    "coupon_id": event.coupon_id,
                    "store_id": event.store_id,
                    "viewed_at": datetime.now(timezone.utc).isoformat()
                }
            }
        }
    )
    return {"success": True}

@api_router.get("/users/{user_id}/recommendations")
async def get_user_recommendations(user_id: str):
    """Get personalized coupon recommendations based on user behavior"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's selected stores and behavior
    selected_stores = user.get("selected_stores", [])
    behavior = user.get("behavior", {})
    
    # Simple recommendation logic (can be enhanced with ML later)
    recommended_coupons = []
    
    # Get coupons from user's stores
    all_coupons = await get_coupons_for_stores(selected_stores, True)
    
    # Prioritize based on categories user has interacted with
    viewed_categories = set()
    for view in behavior.get("coupons_viewed", [])[-50:]:  # Last 50 views
        for store_id, coupons in CURATED_COUPONS.items():
            for c in coupons:
                if c["id"] == view.get("coupon_id"):
                    viewed_categories.add(c["category"])
    
    # Sort coupons: preferred categories first, then by savings value
    def coupon_score(c):
        category_bonus = 100 if c["category"] in viewed_categories else 0
        return category_bonus + c["savings_value"]
    
    sorted_coupons = sorted(all_coupons, key=coupon_score, reverse=True)
    
    return {
        "recommendations": sorted_coupons[:10],
        "based_on": list(viewed_categories) if viewed_categories else ["your selected stores"]
    }

# ============== ADMIN / MANUAL TRIGGER ENDPOINTS ==============

@api_router.post("/admin/trigger-weekly-refresh")
async def trigger_weekly_refresh():
    """Manually trigger weekly bundle refresh for all users (for testing)"""
    await generate_weekly_bundles_for_all_users()
    return {
        "success": True,
        "message": "Weekly bundle refresh triggered for all users"
    }

@api_router.get("/admin/bundle-stats")
async def get_bundle_stats():
    """Get statistics about bundles in the system"""
    total_bundles = await db.bundles.count_documents({})
    active_bundles = await db.bundles.count_documents({"is_active": True})
    total_users = await db.users.count_documents({})
    
    return {
        "total_bundles": total_bundles,
        "active_bundles": active_bundles,
        "total_users": total_users
    }

# ============== LEGACY ENDPOINTS (for backward compatibility) ==============

@api_router.get("/users/{user_id}/coupon-bundles")
async def get_coupon_bundles_legacy(user_id: str, request: Request):
    """Legacy endpoint - redirects to new master bundle system"""
    bundle_response = await get_user_bundle(user_id, request)
    
    if not bundle_response.get("has_bundle"):
        return {
            "store_bundles": [],
            "manufacturer_bundle": None,
            "week_of": datetime.now(timezone.utc).strftime("%B %d, %Y"),
            "total_store_bundles": 0
        }
    
    bundle = bundle_response["bundle"]
    
    return {
        "master_bundle": bundle,
        "store_bundles": [],  # Deprecated - use master_bundle instead
        "manufacturer_bundle": None,  # Deprecated - included in master_bundle
        "week_of": bundle["week_label"],
        "total_store_bundles": len(bundle["stores_included"])
    }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Start the scheduler on app startup"""
    # Schedule weekly bundle generation for Sunday at midnight UTC
    scheduler.add_job(
        generate_weekly_bundles_for_all_users,
        CronTrigger(day_of_week='sun', hour=0, minute=0),
        id='weekly_bundle_generation',
        replace_existing=True
    )
    scheduler.start()
    logger.info("Scheduler started - weekly bundles will be generated every Sunday at midnight UTC")

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown scheduler and database connection"""
    scheduler.shutdown()
    client.close()
