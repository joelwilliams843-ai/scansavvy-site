# ScanSavvy - Product Requirements Document

## Original Problem Statement
Build a full-stack application called "ScanSavvy" - a smart savings assistant that bundles all coupons into one weekly QR code. The app allows users to select their favorite stores and receive a single, scannable QR code containing all available coupons for checkout.

## Core Features
- User onboarding with store selection
- Single master QR code bundling all selected store coupons
- Weekly automatic bundle generation
- Zero-friction MVP using localStorage (no login required)
- Mobile-ready with Capacitor for Android builds

## Tech Stack
- **Frontend:** React (CRA with CRACO), react-router-dom, qrcode.react
- **Backend:** FastAPI, APScheduler for cron jobs
- **Mobile:** Capacitor for Android wrapper
- **Deployment:** Netlify (static hosting)

## Architecture
```
/app/
├── backend/
│   └── server.py       # FastAPI backend with scheduler and mock data
├── frontend/
│   ├── android/        # Capacitor Android project
│   ├── build/          # Production build
│   ├── public/
│   │   ├── _redirects  # SPA routing for Netlify
│   │   └── index.html  # Entry point with JSON-LD
│   ├── src/
│   │   ├── App.css     # All styles
│   │   └── App.js      # Main React app (monolithic)
│   └── capacitor.config.json
└── netlify.toml        # Netlify deployment config
```

## What's Been Implemented

### March 18, 2026
- [x] **Onboarding Flow Bug Fixes:**
  - Removed default store auto-selection (Step 2 starts with 0 selected)
  - Fixed store selection logic (add/remove via cards, search, pills)
  - Fixed Step 3 notification options with visual selection
  - Added conditional inputs: phone for SMS, email confirm for Email, push hint
  - Added summary section showing user's choices
  - Implemented MVP fallback (localStorage + navigate to /bundle if API fails)
  - All 15 tests passed

### March 17, 2026
- [x] **SPA Routing Fix** - Added `_redirects` file for Netlify deployment
- [x] **Production Bug Fix** - Fixed `undefined.filter()` error with safe array fallbacks
- [x] **Onboarding Step 2 Overhaul** - Complete redesign of store selection:
  - Selected stores pills with remove buttons
  - Enhanced search with real-time dropdown
  - Popular Stores section (always visible)
  - More Stores section
  - Fixed bottom action bar
  - Dynamic "Continue with X stores" button
  - Mobile responsive design
  - All tests passed (18/18)

### Previous Session
- [x] Full-stack app with React frontend + FastAPI backend
- [x] User onboarding flow (name, email, store selection, notifications)
- [x] Dashboard with single master QR code display
- [x] Mock backend with weekly bundle generation (APScheduler)
- [x] QR code generation using qrcode.react library
- [x] Public QR code view page for scanned codes
- [x] Zero-friction MVP using localStorage
- [x] Complete branding overhaul (logo, colors, favicons)
- [x] Responsive UI with landing page, pricing, features sections
- [x] Social activity feed (Venmo-style "Top Savers")
- [x] JSON-LD structured data for SEO
- [x] Capacitor setup for Android builds

## Current Status
- **Preview Environment:** Working ✅
- **Live Site (scansavvy.app):** Needs redeployment with all fixes
- **Android Build:** Pending (environment set up, ready to resume)

## Prioritized Backlog

### P0 (Critical)
- [ ] Deploy all fixes to live site (scansavvy.app)
- [ ] Complete Android App Bundle (.AAB) generation

### P1 (High Priority)
- [ ] Replace mock data with real database (MongoDB/PostgreSQL)
- [ ] Implement user accounts and authentication
- [ ] Real coupon data API integration

### P2 (Medium Priority)
- [ ] Paid tier features with Stripe integration
- [ ] Personalization engine for recommendations
- [ ] Savings history tracking
- [ ] Refactor App.js into smaller components (technical debt)

### P3 (Nice to Have)
- [ ] Push notifications implementation
- [ ] SMS/Email notification delivery
- [ ] Family plan sharing features

## Key API Endpoints
- `GET /api/stores` - List all available stores
- `POST /api/users` - Create new user
- `GET /api/users/{id}/bundle` - Get user's current coupon bundle
- `POST /api/users/{id}/bundle/refresh` - Refresh bundle
- `GET /api/bundle/{bundle_id}/view` - Public QR code view page (HTML)

## Data Models (Mock)
- **User:** id, name, email, selected_stores, notification_method, tier
- **Bundle:** id, user_id, coupons, total_savings, valid_until, week_label
- **Coupon:** id, store_id, title, description, discount, expiry

## Test Reports
- `/app/test_reports/iteration_8.json` - Onboarding Step 2 tests (18/18 passed)

## Known Technical Debt
1. **Monolithic Frontend:** `/app/frontend/src/App.js` is 1800+ lines and needs refactoring into:
   - Pages (Home, Onboarding, Dashboard, Privacy)
   - Components (Header, Footer, QRCode, StoreCard, etc.)
   - Hooks (useLocalStorage, useBundle, etc.)

2. **Mock Data:** All coupon and user data is hardcoded/in-memory

## Deployment Notes
- Netlify requires `_redirects` file in build output for SPA routing
- `netlify.toml` specifies `base = "frontend"`, `publish = "build"`
- Android builds require Java 17+ and Android SDK with accepted licenses
