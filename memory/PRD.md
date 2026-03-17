# ScanSavvy Static Website PRD

## Original Problem Statement
Create/update ScanSavvy website - a smart savings assistant app that:
- Lets users select favorite stores, brands, and categories
- Automatically pushes personalized deals and coupons
- Sends weekly or daily notifications based on preferences
- Provides QR codes/coupons in-app when needed

## Key Product Positioning
- Users personalize their preferences
- ScanSavvy pushes relevant savings automatically
- Notifications can be weekly or daily
- QR codes/coupons available in-app
- Reduces effort of saving money

## Architecture
- **Type**: Static website (HTML/CSS/JS)
- **Hosting**: Netlify (auto-deploy from GitHub main branch)
- **Repository**: https://github.com/joelwilliams843-ai/scansavvy-site

## File Structure
```
/
├── index.html
├── style.css
├── app.js
└── assets/
    └── scansavvy-logo.png
```

## What's Been Implemented

### March 17, 2025 - Initial Setup
- [x] Static site structure created
- [x] Logo integration in header
- [x] Favicon configuration

### March 17, 2025 - Messaging Update
- [x] QR code graphic in hero section with floating deal bubbles
- [x] "Scan Once, Save Smarter" tagline
- [x] New hero: "Smart Savings, Sent to You"
- [x] Value proposition banner
- [x] 6 consumer-friendly features:
  - Personalized Deal Matching
  - Daily & Weekly Deal Pushes
  - Favorite Store & Brand Tracking
  - Instant QR & Coupon Access
  - Smart Notifications
  - Easy Savings Dashboard
- [x] New 3-step How It Works flow
- [x] Affordable pricing: Free / $3.99 / $5.99
- [x] Updated CTAs (Get My Deals, Start Saving, etc.)
- [x] Responsive design (mobile/tablet/desktop)

## Testing Status
- Frontend: 100% tests passed
- All messaging aligned with product positioning
- QR code displays prominently
- Pricing consumer-friendly

## Deployment Workflow
1. Commit changes to GitHub repo (main branch)
2. Netlify auto-deploys to https://scansavvy.app

## Next Action Items
- [ ] Push changes to GitHub main branch via "Save to Github" feature
- [ ] Verify Netlify auto-deploy succeeds
- [ ] Test live site at https://scansavvy.app

## Backlog (P1/P2)
- P1: Add mobile hamburger menu
- P1: Add app store download badges
- P2: Add testimonials/social proof section
- P2: Add FAQ section
- P2: Add contact form
