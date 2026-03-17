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
- **Repository**: https://github.com/joelwilliams843-ai/scansavvy-site

## File Structure
```
/app/
├── backend/
│   └── server.py      # FastAPI with user management, store data, coupon bundles
├── frontend/
│   ├── public/
│   │   ├── index.html  # Meta tags, favicon
│   │   └── assets/
│   │       └── scansavvy-logo.png  # Original logo
│   └── src/
│       ├── App.js     # Main app with HomePage, OnboardingPage, DashboardPage
│       └── App.css    # Polished consumer styling
```

## What's Been Implemented

### March 17, 2025 - Polished Landing Page

#### Design Updates
- [x] Restored original ScanSavvy logo in header and favicon
- [x] New headline: "All Your Coupons. One QR Code."
- [x] Hero badge: "Over $2M saved by ScanSavvy users"
- [x] Polished phone mockup with:
  - Target QR card showing "12 coupons ready"
  - Save up to $24.50 display
  - Walmart and CVS store pills
- [x] Floating notification: "Your weekly coupons are ready! $47.25 in savings"
- [x] Store logos section with brand colors:
  - Walmart (blue), Target (red), Kroger (blue), CVS (red)
  - Walgreens (red), Costco (red), Publix (green), Aldi (blue)
  - "+12 more" indicator
- [x] Social proof stats: 50K+ users, $2M+ saved, 4.8★ rating
- [x] Refined How It Works cards with icons
- [x] Trust badges: "Free forever plan", "No credit card required"

#### Previous Features (Still Working)
- [x] Store selection onboarding (20+ stores)
- [x] Manufacturer coupons toggle
- [x] Notification method selection (Push/SMS/Email)
- [x] Dashboard with QR bundles
- [x] Settings management

## Testing Status
- Backend: 100% (14/14 tests passed)
- Frontend: 100% (15/15 features working)
- Integration: 100% (full onboarding to dashboard flow)

## Coupon Data
- **MOCKED**: Coupon data is currently mock/placeholder data
- Backend generates random coupons for each store
- QR codes are unique per user/store/week

## Next Action Items
- [ ] Push to GitHub via "Save to Github" feature
- [ ] Verify Netlify auto-deploy at https://scansavvy.app
- [ ] Integrate real coupon data source (when available)

## Backlog (P1/P2)
- P1: Real coupon data integration
- P1: QR code scanning at checkout
- P2: Push notification service
- P2: SMS/email delivery integration
- P2: Savings history tracking
