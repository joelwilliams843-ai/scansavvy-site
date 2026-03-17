# ScanSavvy - Automatic Coupon Delivery App PRD

## Product Vision
ScanSavvy is a smart savings assistant that automatically delivers weekly coupon bundles to users based on their selected stores. Users find stores near them, select where they shop, receive ALL available coupons bundled into weekly QR codes, and simply scan at checkout to save.

## Core User Flow
1. **Find Stores Near You** - Enter ZIP code or share location
2. **Select Where You Shop** - Choose from available stores
3. **Receive Your Weekly QR** - All coupons bundled into one code
4. **Scan Once & Save** - Apply all coupons instantly at checkout

## Architecture
- **Frontend**: React with React Router
- **Backend**: FastAPI with MongoDB
- **Deployment**: Netlify (via GitHub main branch auto-deploy)
- **Repository**: https://github.com/joelwilliams843-ai/scansavvy-site

## What's Been Implemented

### March 17, 2025 - Latest Updates

#### Location-Based Store Selection
- [x] "Find Stores Near Me" button in hero
- [x] Location modal with geolocation support
- [x] ZIP code entry fallback
- [x] "Stores With Coupons Near You" results view
- [x] Each store shows coupon count

#### Store Logos with Brand Colors
- [x] Walmart (blue #0071DC)
- [x] Target (red #CC0000)
- [x] Kroger (blue #0C3E80)
- [x] CVS (red #CC0000)
- [x] Walgreens (red #E31837)
- [x] Costco (red #E31837)
- [x] Publix (green #3B8C3B)
- [x] ALDI (blue #00529B)
- [x] "+ 12 more retailers" indicator

#### Updated 4-Step Process
1. Find Stores Near You
2. Select Where You Shop
3. Receive Your Weekly QR
4. Scan Once & Save

#### Visual Polish
- [x] Clean, consumer-focused design
- [x] Improved typography and spacing
- [x] Removed Emergent watermark
- [x] Proof avatars with "Join 50,000+ smart shoppers"
- [x] Floating notification animation

#### Previously Implemented Features
- [x] Store selection onboarding (20+ stores)
- [x] Manufacturer coupons toggle
- [x] Notification method selection (Push/SMS/Email)
- [x] Dashboard with QR bundles
- [x] Settings management
- [x] Pricing tiers (Free $0, Premium $3.99, Family $5.99)

## Testing Status
- Backend: 100% (14/14 tests passed)
- Frontend: 100% (all features working)
- Location Modal: Working
- Onboarding Flow: Working

## Mocked Data
- **Store Location Data**: Returns random nearby stores with coupon counts
- **Coupon Data**: Mock coupons generated for each store
- **QR Codes**: Unique per user/store/week

## Next Action Items
- [ ] Push to GitHub via "Save to Github" feature
- [ ] Verify Netlify auto-deploy at https://scansavvy.app
- [ ] Integrate real store location API (when available)
- [ ] Integrate real coupon data source

## Backlog (P1/P2)
- P1: Real store location/availability API
- P1: Real coupon data integration
- P1: QR code scanning at checkout
- P2: Push notification service
- P2: SMS/email delivery integration
- P2: Savings history tracking
