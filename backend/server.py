from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import hashlib
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

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
    created_at: str

class StoreSelectionUpdate(BaseModel):
    store_ids: List[str]

class ManufacturerCouponsToggle(BaseModel):
    enabled: bool

class NotificationMethodUpdate(BaseModel):
    method: str  # "sms", "push", "email"

class CouponBundle(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    store_id: str
    store_name: str
    qr_code_data: str
    coupons: List[dict]
    valid_from: str
    valid_until: str
    total_savings: float

class ManufacturerCouponBundle(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    qr_code_data: str
    coupons: List[dict]
    valid_from: str
    valid_until: str
    total_savings: float

# ============== MOCK DATA ==============

STORES = [
    {"id": "walmart", "name": "Walmart", "logo": "🛒", "category": "Superstore"},
    {"id": "target", "name": "Target", "logo": "🎯", "category": "Superstore"},
    {"id": "kroger", "name": "Kroger", "logo": "🥬", "category": "Grocery"},
    {"id": "publix", "name": "Publix", "logo": "🛍️", "category": "Grocery"},
    {"id": "walgreens", "name": "Walgreens", "logo": "💊", "category": "Pharmacy"},
    {"id": "cvs", "name": "CVS", "logo": "💊", "category": "Pharmacy"},
    {"id": "costco", "name": "Costco", "logo": "📦", "category": "Wholesale"},
    {"id": "sams-club", "name": "Sam's Club", "logo": "📦", "category": "Wholesale"},
    {"id": "aldi", "name": "Aldi", "logo": "🛒", "category": "Grocery"},
    {"id": "dollar-general", "name": "Dollar General", "logo": "💵", "category": "Discount"},
    {"id": "dollar-tree", "name": "Dollar Tree", "logo": "🌳", "category": "Discount"},
    {"id": "safeway", "name": "Safeway", "logo": "🥗", "category": "Grocery"},
    {"id": "whole-foods", "name": "Whole Foods", "logo": "🥑", "category": "Grocery"},
    {"id": "trader-joes", "name": "Trader Joe's", "logo": "🌺", "category": "Grocery"},
    {"id": "wegmans", "name": "Wegmans", "logo": "🍎", "category": "Grocery"},
    {"id": "heb", "name": "H-E-B", "logo": "⭐", "category": "Grocery"},
    {"id": "meijer", "name": "Meijer", "logo": "🛒", "category": "Superstore"},
    {"id": "rite-aid", "name": "Rite Aid", "logo": "💊", "category": "Pharmacy"},
    {"id": "food-lion", "name": "Food Lion", "logo": "🦁", "category": "Grocery"},
    {"id": "stop-shop", "name": "Stop & Shop", "logo": "🛑", "category": "Grocery"},
]

def generate_mock_coupons(store_id: str, store_name: str) -> List[dict]:
    """Generate mock coupons for a store"""
    coupon_templates = [
        {"type": "percent", "values": [5, 10, 15, 20, 25], "items": ["groceries", "household items", "personal care", "snacks", "beverages"]},
        {"type": "dollar", "values": [1, 2, 3, 5, 10], "items": ["purchase of $25+", "purchase of $50+", "purchase of $75+", "any item", "select items"]},
        {"type": "bogo", "values": ["Buy 1 Get 1 Free", "Buy 2 Get 1 Free", "Buy 1 Get 1 50% Off"], "items": ["select items", "snacks", "beverages", "dairy products"]},
    ]
    
    coupons = []
    num_coupons = random.randint(5, 12)
    
    for i in range(num_coupons):
        template = random.choice(coupon_templates)
        if template["type"] == "percent":
            value = random.choice(template["values"])
            item = random.choice(template["items"])
            coupons.append({
                "id": f"{store_id}-coupon-{i}",
                "title": f"{value}% OFF {item.title()}",
                "description": f"Save {value}% on {item} at {store_name}",
                "savings": f"{value}%",
                "expires": (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%m/%d")
            })
        elif template["type"] == "dollar":
            value = random.choice(template["values"])
            item = random.choice(template["items"])
            coupons.append({
                "id": f"{store_id}-coupon-{i}",
                "title": f"${value} OFF {item.title()}",
                "description": f"Save ${value} on {item} at {store_name}",
                "savings": f"${value}",
                "expires": (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%m/%d")
            })
        else:
            value = random.choice(template["values"])
            item = random.choice(template["items"])
            coupons.append({
                "id": f"{store_id}-coupon-{i}",
                "title": value,
                "description": f"{value} on {item} at {store_name}",
                "savings": "BOGO",
                "expires": (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%m/%d")
            })
    
    return coupons

def generate_manufacturer_coupons() -> List[dict]:
    """Generate mock manufacturer coupons"""
    brands = [
        "Coca-Cola", "Pepsi", "Kraft", "General Mills", "Kellogg's", 
        "Procter & Gamble", "Unilever", "Nestlé", "Johnson & Johnson",
        "Colgate-Palmolive", "Clorox", "Tide", "Bounty", "Charmin"
    ]
    
    coupons = []
    for i, brand in enumerate(random.sample(brands, min(8, len(brands)))):
        savings = random.choice([0.50, 0.75, 1.00, 1.50, 2.00, 2.50, 3.00])
        coupons.append({
            "id": f"mfr-coupon-{i}",
            "title": f"${savings:.2f} OFF {brand}",
            "description": f"Save ${savings:.2f} on any {brand} product",
            "brand": brand,
            "savings": f"${savings:.2f}",
            "expires": (datetime.now(timezone.utc) + timedelta(days=14)).strftime("%m/%d")
        })
    
    return coupons

def generate_qr_data(user_id: str, bundle_type: str, store_id: str = None) -> str:
    """Generate a unique QR code data string"""
    timestamp = datetime.now(timezone.utc).strftime("%Y%W")  # Year + Week number
    data = f"SCANSAVVY:{user_id}:{bundle_type}:{store_id or 'MFR'}:{timestamp}"
    return hashlib.sha256(data.encode()).hexdigest()[:32].upper()

# ============== API ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "ScanSavvy API"}

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
        "created_at": datetime.now(timezone.utc).isoformat()
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

@api_router.get("/users/email/{email}", response_model=UserResponse)
async def get_user_by_email(email: str):
    """Get user by email"""
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**user)

@api_router.put("/users/{user_id}/stores")
async def update_user_stores(user_id: str, update: StoreSelectionUpdate):
    """Update user's selected stores"""
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"selected_stores": update.store_ids}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
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

@api_router.get("/users/{user_id}/coupon-bundles")
async def get_coupon_bundles(user_id: str):
    """Get all coupon bundles for a user based on their selected stores"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    bundles = []
    now = datetime.now(timezone.utc)
    valid_from = now.strftime("%Y-%m-%d")
    valid_until = (now + timedelta(days=7)).strftime("%Y-%m-%d")
    
    # Generate store coupon bundles
    for store_id in user.get("selected_stores", []):
        store = next((s for s in STORES if s["id"] == store_id), None)
        if store:
            coupons = generate_mock_coupons(store_id, store["name"])
            total_savings = sum(
                float(c["savings"].replace("$", "").replace("%", "")) 
                for c in coupons if c["savings"] not in ["BOGO"]
            )
            
            bundles.append({
                "id": f"bundle-{store_id}-{now.strftime('%Y%W')}",
                "store_id": store_id,
                "store_name": store["name"],
                "store_logo": store["logo"],
                "qr_code_data": generate_qr_data(user_id, "STORE", store_id),
                "coupons": coupons,
                "coupon_count": len(coupons),
                "valid_from": valid_from,
                "valid_until": valid_until,
                "total_savings": f"${total_savings:.2f}+"
            })
    
    # Generate manufacturer coupon bundle if enabled
    manufacturer_bundle = None
    if user.get("manufacturer_coupons_enabled"):
        mfr_coupons = generate_manufacturer_coupons()
        total_mfr_savings = sum(
            float(c["savings"].replace("$", "")) 
            for c in mfr_coupons
        )
        manufacturer_bundle = {
            "id": f"bundle-manufacturer-{now.strftime('%Y%W')}",
            "qr_code_data": generate_qr_data(user_id, "MFR"),
            "coupons": mfr_coupons,
            "coupon_count": len(mfr_coupons),
            "valid_from": valid_from,
            "valid_until": valid_until,
            "total_savings": f"${total_mfr_savings:.2f}"
        }
    
    return {
        "store_bundles": bundles,
        "manufacturer_bundle": manufacturer_bundle,
        "week_of": now.strftime("%B %d, %Y"),
        "total_store_bundles": len(bundles)
    }

@api_router.get("/users/{user_id}/qr/{bundle_id}")
async def get_qr_code(user_id: str, bundle_id: str):
    """Get specific QR code data for a bundle"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Parse bundle ID to determine type
    if "manufacturer" in bundle_id:
        qr_data = generate_qr_data(user_id, "MFR")
        return {"qr_data": qr_data, "type": "manufacturer"}
    else:
        store_id = bundle_id.replace("bundle-", "").rsplit("-", 1)[0]
        qr_data = generate_qr_data(user_id, "STORE", store_id)
        store = next((s for s in STORES if s["id"] == store_id), None)
        return {"qr_data": qr_data, "type": "store", "store": store}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
