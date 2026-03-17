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

#### "Popular in Your Area" Section (TESTED ✅)
- [x] Trending Deals cards with brand colors:
  - Target 25% OFF household essentials (HOT badge)
  - Walmart $10 OFF $50 grocery (NEW badge)
  - Kroger BOGO Free snacks & beverages
  - CVS 40% OFF health & wellness
- [x] Local savings statistics:
  - $47,230 saved by local shoppers
  - 12,450 coupons redeemed
  - $18.92 avg savings per trip
- [x] Top Savers Near You list (Sarah M., James T., Maria L.)
- [x] "See Deals in My Area" CTA button → opens location modal
- [x] Responsive design for mobile viewports

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
- Backend: 100% (18/18 API tests passed)
- Frontend: 100% (all P0, P1, P2 features tested and working)
- Popular in Your Area: ✅ TESTED (iteration_6)
- Location Modal: ✅ Working
- Onboarding Flow: ✅ Working
- Dashboard: ✅ Working

## Mocked Data (IMPORTANT)
All data is currently MOCKED:
- **Store Location Data**: Returns random nearby stores with coupon counts
- **Coupon Data**: Mock coupons generated for each store
- **QR Codes**: Unique per user/store/week
- **Popular Section Stats**: Hardcoded values ($47,230, 12,450, $18.92)
- **Top Savers**: Hardcoded names and savings amounts
- **Trending Deals**: Hardcoded deal data

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
- P2: Refactor App.js into smaller components (currently 1474 lines)

## Test Reports
- /app/test_reports/iteration_1.json
- /app/test_reports/iteration_2.json
- /app/test_reports/iteration_3.json
- /app/test_reports/iteration_4.json
- /app/test_reports/iteration_5.json
- /app/test_reports/iteration_6.json (latest - Popular section verified)
