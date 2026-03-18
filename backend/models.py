"""
ScanSavvy Database Models
Real coupon pipeline with Supabase PostgreSQL
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Float, Boolean, Integer, Index
from sqlalchemy.orm import relationship
from database import Base


def generate_uuid():
    return str(uuid.uuid4())[:12].upper()


def utc_now():
    """Return current UTC time as naive datetime (for TIMESTAMP WITHOUT TIME ZONE)"""
    return datetime.utcnow()


class Store(Base):
    """Store table - represents retail stores"""
    __tablename__ = 'stores'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, unique=True, index=True)
    logo = Column(String(50), default="🏪")
    color = Column(String(20), default="#666666")
    category = Column(String(100), default="Retail")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    
    # Relationships
    coupons = relationship('Coupon', back_populates='store', cascade='all, delete-orphan')
    bundles = relationship('CouponBundle', back_populates='store', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "logo": self.logo,
            "color": self.color,
            "category": self.category,
            "is_active": self.is_active
        }


class Coupon(Base):
    """Coupon table - individual coupon offers"""
    __tablename__ = 'coupons'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    store_id = Column(String(36), ForeignKey('stores.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    discount = Column(String(50), nullable=False)  # e.g., "$5 OFF", "20% OFF", "BOGO"
    discount_value = Column(Float, default=0.0)  # Numeric value for calculations
    expiry_date = Column(DateTime, nullable=False, index=True)
    category = Column(String(100), default="General")
    barcode = Column(String(100))
    terms = Column(Text)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=utc_now)
    
    # Relationships
    store = relationship('Store', back_populates='coupons')
    bundle_items = relationship('BundleCoupon', back_populates='coupon', cascade='all, delete-orphan')
    
    __table_args__ = (
        Index('idx_coupon_store_active', 'store_id', 'is_active'),
        Index('idx_coupon_expiry', 'expiry_date'),
    )
    
    def to_dict(self):
        return {
            "id": self.id,
            "store_id": self.store_id,
            "title": self.title,
            "description": self.description,
            "discount": self.discount,
            "discount_value": self.discount_value,
            "expiry_date": self.expiry_date.isoformat() if self.expiry_date else None,
            "category": self.category,
            "barcode": self.barcode,
            "terms": self.terms,
            "is_active": self.is_active
        }


class CouponBundle(Base):
    """Coupon Bundle table - weekly bundles for stores"""
    __tablename__ = 'coupon_bundles'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    store_id = Column(String(36), ForeignKey('stores.id', ondelete='CASCADE'), nullable=False, index=True)
    week_label = Column(String(50), nullable=False)  # e.g., "Week of March 15"
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False, index=True)
    total_savings = Column(Float, default=0.0)
    coupon_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=utc_now)
    
    # Relationships
    store = relationship('Store', back_populates='bundles')
    bundle_coupons = relationship('BundleCoupon', back_populates='bundle', cascade='all, delete-orphan')
    
    __table_args__ = (
        Index('idx_bundle_store_active', 'store_id', 'is_active'),
    )
    
    def to_dict(self, include_coupons=False):
        result = {
            "id": self.id,
            "store_id": self.store_id,
            "week_label": self.week_label,
            "valid_from": self.valid_from.isoformat() if self.valid_from else None,
            "valid_until": self.valid_until.isoformat() if self.valid_until else None,
            "total_savings": self.total_savings,
            "coupon_count": self.coupon_count,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
        if include_coupons and self.bundle_coupons:
            result["coupons"] = [bc.coupon.to_dict() for bc in self.bundle_coupons if bc.coupon]
        return result


class BundleCoupon(Base):
    """Junction table for bundle-coupon many-to-many relationship"""
    __tablename__ = 'bundle_coupons'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    bundle_id = Column(String(36), ForeignKey('coupon_bundles.id', ondelete='CASCADE'), nullable=False, index=True)
    coupon_id = Column(String(36), ForeignKey('coupons.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = Column(DateTime, default=utc_now)
    
    # Relationships
    bundle = relationship('CouponBundle', back_populates='bundle_coupons')
    coupon = relationship('Coupon', back_populates='bundle_items')
    
    __table_args__ = (
        Index('idx_bundle_coupon_unique', 'bundle_id', 'coupon_id', unique=True),
    )


class UserBundle(Base):
    """User's selected bundles for their QR code"""
    __tablename__ = 'user_bundles'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_name = Column(String(255), default="Guest")
    user_email = Column(String(255))
    week_label = Column(String(50), nullable=False)
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    total_savings = Column(Float, default=0.0)
    coupon_count = Column(Integer, default=0)
    store_ids = Column(Text)  # Comma-separated store IDs
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=utc_now)
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_name": self.user_name,
            "user_email": self.user_email,
            "week_label": self.week_label,
            "valid_from": self.valid_from.isoformat() if self.valid_from else None,
            "valid_until": self.valid_until.isoformat() if self.valid_until else None,
            "total_savings": self.total_savings,
            "coupon_count": self.coupon_count,
            "store_ids": self.store_ids.split(",") if self.store_ids else [],
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
