"""
Bundle Generation Service
Creates weekly coupon bundles from active coupons in the database
"""
import asyncio
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from database import AsyncSessionLocal
from models import Store, Coupon, CouponBundle, BundleCoupon, UserBundle


def get_week_label() -> str:
    """Get the current week label (e.g., 'Week of March 15')"""
    now = datetime.utcnow()
    # Get Monday of current week
    monday = now - timedelta(days=now.weekday())
    return f"Week of {monday.strftime('%B %d')}"


def get_week_dates() -> tuple:
    """Get the start and end dates for the current week"""
    now = datetime.utcnow()
    # Get Monday of current week
    monday = now - timedelta(days=now.weekday())
    monday = monday.replace(hour=0, minute=0, second=0, microsecond=0)
    # Sunday end of week
    sunday = monday + timedelta(days=6, hours=23, minutes=59, seconds=59)
    return monday, sunday


async def get_active_coupons(db: AsyncSession, store_id: str) -> List[Coupon]:
    """Fetch all active, non-expired coupons for a store"""
    now = datetime.utcnow()
    
    result = await db.execute(
        select(Coupon)
        .where(
            and_(
                Coupon.store_id == store_id,
                Coupon.is_active == True,
                Coupon.expiry_date > now
            )
        )
        .order_by(Coupon.discount_value.desc())
    )
    return result.scalars().all()


async def create_store_bundle(db: AsyncSession, store_id: str) -> Optional[CouponBundle]:
    """Create a weekly bundle for a specific store"""
    # Get active coupons
    coupons = await get_active_coupons(db, store_id)
    
    if not coupons:
        print(f"No active coupons found for store {store_id}")
        return None
    
    # Get week info
    week_label = get_week_label()
    valid_from, valid_until = get_week_dates()
    
    # Check if bundle already exists for this week
    result = await db.execute(
        select(CouponBundle)
        .where(
            and_(
                CouponBundle.store_id == store_id,
                CouponBundle.week_label == week_label,
                CouponBundle.is_active == True
            )
        )
    )
    existing_bundle = result.scalar_one_or_none()
    
    if existing_bundle:
        # Deactivate old bundle
        existing_bundle.is_active = False
        await db.commit()
    
    # Calculate total savings
    total_savings = sum(c.discount_value for c in coupons)
    
    # Create new bundle
    bundle = CouponBundle(
        store_id=store_id,
        week_label=week_label,
        valid_from=valid_from,
        valid_until=valid_until,
        total_savings=total_savings,
        coupon_count=len(coupons),
        is_active=True
    )
    db.add(bundle)
    await db.commit()
    await db.refresh(bundle)
    
    # Link coupons to bundle
    for coupon in coupons:
        bundle_coupon = BundleCoupon(
            bundle_id=bundle.id,
            coupon_id=coupon.id
        )
        db.add(bundle_coupon)
    
    await db.commit()
    
    return bundle


async def create_user_bundle(
    db: AsyncSession,
    store_ids: List[str],
    user_name: str = "Guest",
    user_email: str = None
) -> UserBundle:
    """Create a personalized bundle for a user with selected stores"""
    # Get week info
    week_label = get_week_label()
    valid_from, valid_until = get_week_dates()
    
    # Gather all coupons from selected stores
    total_savings = 0.0
    total_coupons = 0
    
    for store_id in store_ids:
        coupons = await get_active_coupons(db, store_id)
        total_coupons += len(coupons)
        total_savings += sum(c.discount_value for c in coupons)
    
    # Create user bundle
    user_bundle = UserBundle(
        user_name=user_name,
        user_email=user_email,
        week_label=week_label,
        valid_from=valid_from,
        valid_until=valid_until,
        total_savings=total_savings,
        coupon_count=total_coupons,
        store_ids=",".join(store_ids),
        is_active=True
    )
    db.add(user_bundle)
    await db.commit()
    await db.refresh(user_bundle)
    
    return user_bundle


async def get_bundle_with_coupons(db: AsyncSession, bundle_id: str) -> Optional[dict]:
    """Get a bundle with all its coupons"""
    # First try store bundle
    result = await db.execute(
        select(CouponBundle)
        .options(
            selectinload(CouponBundle.bundle_coupons).selectinload(BundleCoupon.coupon),
            selectinload(CouponBundle.store)
        )
        .where(CouponBundle.id == bundle_id)
    )
    bundle = result.scalar_one_or_none()
    
    if bundle:
        return {
            "type": "store_bundle",
            "id": bundle.id,
            "store_name": bundle.store.name if bundle.store else "Unknown",
            "store_logo": bundle.store.logo if bundle.store else "🏪",
            "store_color": bundle.store.color if bundle.store else "#666",
            "week_label": bundle.week_label,
            "valid_from": bundle.valid_from.isoformat() if bundle.valid_from else None,
            "valid_until": bundle.valid_until.isoformat() if bundle.valid_until else None,
            "total_savings": bundle.total_savings,
            "coupon_count": bundle.coupon_count,
            "coupons": [
                {
                    "id": bc.coupon.id,
                    "title": bc.coupon.title,
                    "description": bc.coupon.description,
                    "discount": bc.coupon.discount,
                    "discount_value": bc.coupon.discount_value,
                    "category": bc.coupon.category,
                    "barcode": bc.coupon.barcode,
                    "terms": bc.coupon.terms,
                    "expiry_date": bc.coupon.expiry_date.strftime("%b %d, %Y") if bc.coupon.expiry_date else None
                }
                for bc in bundle.bundle_coupons if bc.coupon
            ]
        }
    
    # Try user bundle
    result = await db.execute(
        select(UserBundle).where(UserBundle.id == bundle_id)
    )
    user_bundle = result.scalar_one_or_none()
    
    if user_bundle:
        # Get coupons for all stores in the user bundle
        store_ids = user_bundle.store_ids.split(",") if user_bundle.store_ids else []
        all_coupons = []
        stores_info = []
        
        for store_id in store_ids:
            # Get store info
            store_result = await db.execute(
                select(Store).where(Store.id == store_id)
            )
            store = store_result.scalar_one_or_none()
            if store:
                stores_info.append({
                    "id": store.id,
                    "name": store.name,
                    "logo": store.logo,
                    "color": store.color
                })
            
            # Get coupons
            coupons = await get_active_coupons(db, store_id)
            for coupon in coupons:
                all_coupons.append({
                    "id": coupon.id,
                    "store_id": coupon.store_id,
                    "store_name": store.name if store else "Unknown",
                    "title": coupon.title,
                    "description": coupon.description,
                    "discount": coupon.discount,
                    "discount_value": coupon.discount_value,
                    "category": coupon.category,
                    "barcode": coupon.barcode,
                    "terms": coupon.terms,
                    "expiry_date": coupon.expiry_date.strftime("%b %d, %Y") if coupon.expiry_date else None
                })
        
        return {
            "type": "user_bundle",
            "id": user_bundle.id,
            "user_name": user_bundle.user_name,
            "stores": stores_info,
            "week_label": user_bundle.week_label,
            "valid_from": user_bundle.valid_from.isoformat() if user_bundle.valid_from else None,
            "valid_until": user_bundle.valid_until.isoformat() if user_bundle.valid_until else None,
            "total_savings": user_bundle.total_savings,
            "coupon_count": len(all_coupons),
            "coupons": all_coupons
        }
    
    return None


async def generate_kroger_bundle():
    """Generate a weekly bundle for Kroger"""
    print("=" * 50)
    print("ScanSavvy Bundle Generation Service")
    print("=" * 50)
    
    async with AsyncSessionLocal() as db:
        # Create Kroger bundle
        bundle = await create_store_bundle(db, "kroger")
        
        if bundle:
            print(f"\nBundle created successfully!")
            print(f"{'=' * 50}")
            print(f"Bundle ID: {bundle.id}")
            print(f"Store: Kroger")
            print(f"Week: {bundle.week_label}")
            print(f"Valid until: {bundle.valid_until}")
            print(f"Coupons: {bundle.coupon_count}")
            print(f"Total savings: ${bundle.total_savings:.2f}")
            print(f"{'=' * 50}")
            print(f"\nQR Code URL: /api/bundle/{bundle.id}/view")
            
            return bundle
        else:
            print("Failed to create bundle - no active coupons found")
            return None


if __name__ == "__main__":
    asyncio.run(generate_kroger_bundle())
