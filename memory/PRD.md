# ScanSavvy - Automatic Coupon Delivery App PRD

## Product Vision
ScanSavvy is a smart savings assistant that automatically delivers weekly coupon bundles to users based on their selected stores. Users select stores, receive ALL available coupons bundled into weekly QR codes, and simply scan at checkout to save.

## Core Product Concept
- Users select the stores they shop at most
- ScanSavvy collects ALL available coupons for those stores
- Coupons are bundled into weekly QR codes (one per store)
- QR codes update automatically each week
- Optional manufacturer coupons available across all retailers

## Architecture
- **Frontend**: React with React Router
- **Backend**: FastAPI with MongoDB
- **Deployment**: Netlify (via GitHub main branch auto-deploy)

## File Structure
```
/app/
├── backend/
│   └── server.py      # FastAPI with user management, store data, coupon bundles
├── frontend/
│   └── src/
│       ├── App.js     # Main app with HomePage, OnboardingPage, DashboardPage
│       └── App.css    # Complete styling
```

## What's Been Implemented

### March 17, 2025 - Core Feature Build

#### Homepage
- [x] Hero: "Pick Your Stores. Get Every Coupon Sent to Your Phone."
- [x] Phone mockup with QR code and weekly savings notification
- [x] Trust badges: Free to start, Updates weekly, Works at 20+ stores
- [x] How It Works: 3 steps (Pick Stores → Get QR Bundle → Scan & Save)
- [x] Features section (6 cards)
- [x] Pricing: Free ($0), Premium ($3.99), Family ($5.99)
- [x] CTA section

#### Onboarding Flow
- [x] Step 1: Name and email collection
- [x] Step 2: Store selection grid with 20+ stores
  - Walmart, Target, Kroger, Publix, Walgreens, CVS, Costco, Sam's Club, Aldi, Dollar General, Dollar Tree, Safeway, Whole Foods, Trader Joe's, Wegmans, H-E-B, Meijer, Rite Aid, Food Lion, Stop & Shop
- [x] Step 2: Search functionality for stores
- [x] Step 3: Manufacturer Coupons toggle
- [x] Step 3: Notification method selection (Push/SMS/Email)

#### Dashboard (Coupon Wallet)
- [x] User greeting with week label
- [x] Total weekly savings display
- [x] "My Coupons" tab with QR bundles per store
- [x] Each bundle shows: store name/logo, QR code, coupon count, savings amount
- [x] Bundle detail view with full QR code and coupon list
- [x] Manufacturer coupon bundle (if enabled)
- [x] "Settings" tab with:
  - Store selection editor
  - Manufacturer coupons toggle
  - Notification method selection

#### Backend API
- [x] GET /api/stores - List all 20+ stores with search
- [x] POST /api/users - Create user
- [x] GET /api/users/{id} - Get user
- [x] PUT /api/users/{id}/stores - Update selected stores
- [x] PUT /api/users/{id}/manufacturer-coupons - Toggle manufacturer coupons
- [x] PUT /api/users/{id}/notification-method - Update notification preference
- [x] GET /api/users/{id}/coupon-bundles - Get weekly QR bundles with coupons

## Testing Status
- Backend: 100% (14/14 tests passed)
- Frontend: 95% (minor UI improvements available)

## Coupon Data
- **MOCKED**: Coupon data is currently mock/placeholder data
- Backend generates random coupons for each store
- QR codes are unique per user/store/week but don't contain real coupon data

## Next Action Items
- [ ] Push to GitHub via "Save to Github" feature
- [ ] Verify Netlify auto-deploy
- [ ] Integrate real coupon data source (when available)
- [ ] Implement actual QR code encoding for checkout scanning
- [ ] Add SMS/email notification service integration

## Backlog (P1/P2)
- P1: Real coupon data integration
- P1: QR code scanning at checkout (retailer integration)
- P2: Push notification implementation
- P2: SMS delivery via Twilio
- P2: Email delivery via SendGrid
- P2: Savings history tracking
- P2: Social sharing features
