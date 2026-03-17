import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Production URL for QR codes (must be HTTPS and fully qualified)
const getQRCodeUrl = (bundleId) => {
  // Use production URL for QR codes
  return `${BACKEND_URL}/api/bundle/${bundleId}/view`;
};

// ============== REAL QR CODE COMPONENT ==============
// Uses qrcode.react library for proper scannable QR codes

const QRCodeDisplay = ({ bundleId, size = 256 }) => {
  const qrUrl = getQRCodeUrl(bundleId);
  
  return (
    <div className="qr-code-container" style={{ background: 'white', padding: '16px', borderRadius: '8px' }}>
      <QRCodeSVG
        value={qrUrl}
        size={size}
        level="M"
        bgColor="#FFFFFF"
        fgColor="#000000"
        includeMargin={false}
      />
    </div>
  );
};

// ============== COMPONENTS ==============

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  return (
    <header className="header">
      <nav className="navbar">
        <div className="logo-container" onClick={() => navigate("/")} style={{cursor: "pointer"}}>
          <img src="/assets/scansavvy-logo.png" alt="ScanSavvy" className="logo-image" />
          <span className="logo-text">ScanSavvy</span>
        </div>
        
        {!user && location.pathname === "/" && (
          <div className="nav-links">
            <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')}>How It Works</a>
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')}>Features</a>
            <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')}>Pricing</a>
          </div>
        )}
        
        <div className="nav-actions">
          {user ? (
            <>
              <button className="btn-text" onClick={() => navigate("/dashboard")} data-testid="nav-dashboard">
                My Coupons
              </button>
              <button className="btn-text" onClick={onLogout} data-testid="nav-logout">
                Sign Out
              </button>
            </>
          ) : (
            <button className="btn-primary" onClick={() => navigate("/onboarding")} data-testid="nav-get-started">
              Get Started
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

// ============== PAGES ==============

const HomePage = ({ onGetStarted }) => {
  const [zipCode, setZipCode] = useState("");
  const [locationStatus, setLocationStatus] = useState("idle");
  const [nearbyStores, setNearbyStores] = useState([]);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const allStores = [
    { id: "walmart", name: "Walmart", coupons: 7, color: "#0071DC" },
    { id: "target", name: "Target", coupons: 6, color: "#CC0000" },
    { id: "kroger", name: "Kroger", coupons: 5, color: "#0C3E80" },
    { id: "cvs", name: "CVS", coupons: 5, color: "#CC0000" },
    { id: "walgreens", name: "Walgreens", coupons: 4, color: "#E31837" },
    { id: "costco", name: "Costco", coupons: 4, color: "#E31837" },
    { id: "publix", name: "Publix", coupons: 4, color: "#3B8C3B" },
    { id: "aldi", name: "Aldi", coupons: 3, color: "#00529B" },
    { id: "safeway", name: "Safeway", coupons: 3, color: "#E8322E" },
    { id: "whole-foods", name: "Whole Foods", coupons: 3, color: "#00674B" },
  ];

  const handleGetLocation = () => {
    setLocationStatus("loading");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setTimeout(() => {
            const shuffled = [...allStores].sort(() => 0.5 - Math.random());
            setNearbyStores(shuffled.slice(0, 6 + Math.floor(Math.random() * 3)));
            setLocationStatus("found");
          }, 1000);
        },
        () => setLocationStatus("error")
      );
    } else {
      setLocationStatus("error");
    }
  };

  const handleZipSubmit = (e) => {
    e.preventDefault();
    if (zipCode.length === 5) {
      setLocationStatus("loading");
      setTimeout(() => {
        const shuffled = [...allStores].sort(() => 0.5 - Math.random());
        setNearbyStores(shuffled.slice(0, 6 + Math.floor(Math.random() * 3)));
        setLocationStatus("found");
      }, 800);
    }
  };

  return (
    <main className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 data-testid="hero-title">All Your Coupons.<br/>One QR Code.</h1>
          <p className="hero-subtitle" data-testid="hero-subtitle">
            Select your stores, get every available coupon bundled into one weekly QR code. 
            At checkout, scan once and save instantly.
          </p>
          <div className="hero-cta-group">
            <button className="btn-primary btn-xl" onClick={() => setShowLocationModal(true)} data-testid="hero-cta">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Find Stores Near Me
            </button>
            <a href="#how-it-works" className="btn-link" data-testid="hero-learn-more">
              See how it works →
            </a>
          </div>
          <div className="hero-proof">
            <div className="proof-avatars">
              <div className="avatar">J</div>
              <div className="avatar">S</div>
              <div className="avatar">M</div>
              <div className="avatar">+</div>
            </div>
            <span>Join 50,000+ smart shoppers saving weekly</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="phone-frame">
            <div className="phone-notch"></div>
            <div className="phone-content">
              <div className="app-bar">
                <img src="/assets/scansavvy-logo.png" alt="" className="app-bar-logo" />
                <span>My Coupons</span>
              </div>
              <div className="coupon-card-demo">
                <div className="card-header">
                  <span className="week-badge">Week of March 17</span>
                </div>
                <div className="qr-demo">
                  <QRCodeSVG value="https://scansavvy.app" size={100} bgColor="#FFFFFF" fgColor="#000000" />
                </div>
                <div className="card-savings">
                  <span className="savings-amount">$47.50</span>
                  <span className="savings-label">estimated savings</span>
                </div>
                <div className="store-count-badge">12 coupons • 4 stores</div>
              </div>
            </div>
          </div>
          <div className="floating-alert">
            <div className="alert-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
            </div>
            <div className="alert-text">
              <strong>Weekly bundle ready!</strong>
              <span>Scan to save $47.50</span>
            </div>
          </div>
        </div>
      </section>

      {/* Store Partners Section */}
      <section className="partners-section">
        <p className="partners-label">Coupons available at these stores and more</p>
        <div className="partners-logos">
          <div className="partner-logo" style={{backgroundColor: '#0071DC'}}>
            <span className="partner-name" style={{color: 'white', fontWeight: '700'}}>Walmart</span>
          </div>
          <div className="partner-logo" style={{backgroundColor: '#CC0000'}}>
            <span className="partner-name" style={{color: 'white', fontWeight: '700'}}>Target</span>
          </div>
          <div className="partner-logo" style={{backgroundColor: '#0C3E80'}}>
            <span className="partner-name" style={{color: 'white', fontWeight: '700'}}>Kroger</span>
          </div>
          <div className="partner-logo" style={{backgroundColor: '#CC0000'}}>
            <span className="partner-name" style={{color: 'white', fontWeight: '700'}}>CVS</span>
          </div>
          <div className="partner-logo" style={{backgroundColor: '#E31837'}}>
            <span className="partner-name" style={{color: 'white', fontWeight: '700'}}>Walgreens</span>
          </div>
          <div className="partner-logo" style={{backgroundColor: '#E31837'}}>
            <span className="partner-name" style={{color: 'white', fontWeight: '700'}}>Costco</span>
          </div>
          <div className="partner-logo" style={{backgroundColor: '#3B8C3B'}}>
            <span className="partner-name" style={{color: 'white', fontWeight: '700'}}>Publix</span>
          </div>
          <div className="partner-logo" style={{backgroundColor: '#00529B'}}>
            <span className="partner-name" style={{color: 'white', fontWeight: '700'}}>ALDI</span>
          </div>
        </div>
        <p className="partners-count">+ 12 more retailers</p>
      </section>

      {/* Popular in Your Area Section */}
      <section className="popular-section" data-testid="popular-section">
        <div className="section-intro">
          <h2 className="section-title">Popular in Your Area</h2>
          <p className="section-desc">See what shoppers near you are saving on this week</p>
        </div>
        
        <div className="popular-grid">
          <div className="trending-deals">
            <h3 className="popular-heading">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              Trending Deals
            </h3>
            <div className="deal-cards">
              <div className="deal-card">
                <div className="deal-badge hot">HOT</div>
                <div className="deal-store-name" style={{color: '#CC0000'}}>Target</div>
                <div className="deal-offer">25% OFF</div>
                <div className="deal-desc">All household essentials</div>
                <div className="deal-claimed">2,340 claimed today</div>
              </div>
              <div className="deal-card">
                <div className="deal-badge new">NEW</div>
                <div className="deal-store-name" style={{color: '#0071DC'}}>Walmart</div>
                <div className="deal-offer">$10 OFF $50</div>
                <div className="deal-desc">Grocery purchases</div>
                <div className="deal-claimed">1,892 claimed today</div>
              </div>
              <div className="deal-card">
                <div className="deal-store-name" style={{color: '#0C3E80'}}>Kroger</div>
                <div className="deal-offer">BOGO Free</div>
                <div className="deal-desc">Select snacks & beverages</div>
                <div className="deal-claimed">1,567 claimed today</div>
              </div>
              <div className="deal-card">
                <div className="deal-store-name" style={{color: '#CC0000'}}>CVS</div>
                <div className="deal-offer">40% OFF</div>
                <div className="deal-desc">Health & wellness items</div>
                <div className="deal-claimed">987 claimed today</div>
              </div>
            </div>
          </div>
          
          <div className="local-stats">
            <h3 className="popular-heading">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Your Area This Week
            </h3>
            <div className="stats-cards">
              <div className="stat-card">
                <div className="stat-value">$47,230</div>
                <div className="stat-label">Saved by local shoppers</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">12,450</div>
                <div className="stat-label">Coupons redeemed</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">$18.92</div>
                <div className="stat-label">Avg savings per trip</div>
              </div>
            </div>
            
            <div className="top-savers">
              <h4>Top Savers Near You</h4>
              <div className="saver-list">
                <div className="saver-item">
                  <div className="saver-avatar">S</div>
                  <div className="saver-info">
                    <span className="saver-name">Sarah M.</span>
                    <span className="saver-amount">Saved $156 this month</span>
                  </div>
                </div>
                <div className="saver-item">
                  <div className="saver-avatar">J</div>
                  <div className="saver-info">
                    <span className="saver-name">James T.</span>
                    <span className="saver-amount">Saved $142 this month</span>
                  </div>
                </div>
                <div className="saver-item">
                  <div className="saver-avatar">M</div>
                  <div className="saver-info">
                    <span className="saver-name">Maria L.</span>
                    <span className="saver-amount">Saved $128 this month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="popular-cta">
          <button className="btn-primary btn-xl" onClick={() => setShowLocationModal(true)}>
            See Deals in My Area
          </button>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="section-intro">
          <h2 className="section-title" data-testid="how-it-works-title">How It Works</h2>
          <p className="section-desc">Four simple steps to automatic savings</p>
        </div>
        <div className="process-steps">
          <div className="process-step" data-testid="step-1">
            <div className="step-num">1</div>
            <div className="step-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <h3>Find Stores Near You</h3>
            <p>Enter your ZIP code or share your location to see which stores have coupons in your area.</p>
          </div>
          <div className="step-line"></div>
          <div className="process-step" data-testid="step-2">
            <div className="step-num">2</div>
            <div className="step-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12l2 2 4-4"/>
                <rect x="3" y="3" width="18" height="18" rx="2"/>
              </svg>
            </div>
            <h3>Select Your Stores</h3>
            <p>Choose your favorite stores. We'll track all available coupons for those stores automatically.</p>
          </div>
          <div className="step-line"></div>
          <div className="process-step" data-testid="step-3">
            <div className="step-num">3</div>
            <div className="step-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <path d="M14 14h7v7"/>
              </svg>
            </div>
            <h3>Get Your Weekly QR</h3>
            <p>Every Sunday, we bundle ALL your coupons into ONE QR code and send it to your phone.</p>
          </div>
          <div className="step-line"></div>
          <div className="process-step" data-testid="step-4">
            <div className="step-num">4</div>
            <div className="step-icon-wrap green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            </div>
            <h3>Scan Once & Save</h3>
            <p>Show your single QR code at checkout. All your coupons apply instantly. It's that easy.</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="section-intro">
          <h2 className="section-title" data-testid="features-title">Why ScanSavvy?</h2>
          <p className="section-desc">Save time and money with smart coupon delivery</p>
        </div>
        <div className="features-grid">
          <div className="feature-item" data-testid="feature-automatic">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h3>Weekly Auto-Updates</h3>
            <p>Fresh coupons bundled every Sunday at midnight. No searching, no clipping, no effort required.</p>
          </div>
          <div className="feature-item" data-testid="feature-one-qr">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
              </svg>
            </div>
            <h3>One QR = All Coupons</h3>
            <p>Every coupon from every store bundled into a single scannable code. Fast checkout, maximum savings.</p>
          </div>
          <div className="feature-item" data-testid="feature-location">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <h3>Location-Based</h3>
            <p>See which stores have coupons near you. Only get deals for stores you actually visit.</p>
          </div>
          <div className="feature-item" data-testid="feature-brands">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 7h-9M14 17H5"/>
                <circle cx="17" cy="17" r="3"/>
                <circle cx="7" cy="7" r="3"/>
              </svg>
            </div>
            <h3>Brand Coupons Too</h3>
            <p>Get manufacturer coupons from top brands that work at any participating store.</p>
          </div>
          <div className="feature-item" data-testid="feature-alerts">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
            </div>
            <h3>Smart Alerts</h3>
            <p>Get notified when new bundles are ready. Never miss a deal.</p>
          </div>
          <div className="feature-item" data-testid="feature-free">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h3>Free to Start</h3>
            <p>No credit card required. Start saving immediately with our free plan.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing" id="pricing">
        <div className="section-intro">
          <h2 className="section-title" data-testid="pricing-title">Simple Pricing</h2>
          <p className="section-desc">Plans that pay for themselves in savings</p>
        </div>
        <div className="pricing-grid">
          <div className="price-card" data-testid="pricing-free">
            <h3>Free</h3>
            <div className="price-amount">$0<span>/mo</span></div>
            <p className="price-tagline">Get started for free</p>
            <ul className="price-features">
              <li>Up to 3 stores</li>
              <li>1 weekly QR bundle (Sundays)</li>
              <li>Push notifications</li>
              <li>Basic savings dashboard</li>
            </ul>
            <button className="btn-secondary btn-block" onClick={onGetStarted}>Start Free</button>
          </div>
          <div className="price-card featured" data-testid="pricing-premium">
            <div className="price-badge">Popular</div>
            <h3>Premium</h3>
            <div className="price-amount">$3.99<span>/mo</span></div>
            <p className="price-tagline">For regular shoppers</p>
            <ul className="price-features">
              <li>Unlimited stores</li>
              <li>Multiple QR refreshes/week</li>
              <li>Manufacturer coupons</li>
              <li>Personalized recommendations</li>
              <li>Priority high-value deals</li>
              <li>Full savings dashboard</li>
            </ul>
            <button className="btn-primary btn-block" onClick={onGetStarted}>Start 14-Day Trial</button>
          </div>
          <div className="price-card" data-testid="pricing-family">
            <h3>Family</h3>
            <div className="price-amount">$5.99<span>/mo</span></div>
            <p className="price-tagline">For households</p>
            <ul className="price-features">
              <li>Everything in Premium</li>
              <li>Up to 5 members</li>
              <li>Shared coupon bundles</li>
              <li>Family spending insights</li>
            </ul>
            <button className="btn-secondary btn-block" onClick={onGetStarted}>Get Family</button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="cta-inner">
          <h2>Start Saving Today</h2>
          <p>Find stores near you, pick your favorites, and get your first weekly QR code.</p>
          <button className="btn-primary btn-xl btn-white" onClick={() => setShowLocationModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Find Stores Near Me
          </button>
          <span className="cta-sub">Free forever plan • No credit card required</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-logo-wrap">
              <img src="/assets/scansavvy-logo.png" alt="ScanSavvy" className="footer-brand-logo" />
              <span>ScanSavvy</span>
            </div>
            <p>All your coupons. One QR code.</p>
          </div>
          <div className="footer-nav">
            <div className="footer-nav-col">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#how-it-works">How It Works</a>
            </div>
            <div className="footer-nav-col">
              <h4>Support</h4>
              <a href="#">Help Center</a>
              <a href="#">Contact Us</a>
            </div>
            <div className="footer-nav-col">
              <h4>Legal</h4>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom-bar">
          <p>© 2025 ScanSavvy. All rights reserved.</p>
        </div>
      </footer>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="modal-overlay" onClick={() => setShowLocationModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} data-testid="location-modal">
            <button className="modal-close" onClick={() => setShowLocationModal(false)}>×</button>
            
            {locationStatus === "idle" && (
              <div className="location-prompt">
                <div className="location-icon-large">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <h3>Find Stores With Coupons</h3>
                <p>We'll show you which stores have coupons available in your area.</p>
                
                <button className="btn-primary btn-block location-btn" onClick={handleGetLocation}>
                  Use My Location
                </button>
                
                <div className="location-divider">
                  <span>or enter ZIP code</span>
                </div>
                
                <form onSubmit={handleZipSubmit} className="zip-form">
                  <input 
                    type="text" 
                    placeholder="Enter ZIP code"
                    value={zipCode}
                    onChange={e => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    maxLength={5}
                    data-testid="zip-input"
                  />
                  <button type="submit" className="btn-primary" disabled={zipCode.length !== 5}>
                    Find Stores
                  </button>
                </form>
              </div>
            )}
            
            {locationStatus === "loading" && (
              <div className="location-loading">
                <div className="loading-spinner-large"></div>
                <p>Finding stores near you...</p>
              </div>
            )}
            
            {locationStatus === "found" && (
              <div className="location-results" data-testid="stores-near-you">
                <h3>Stores With Coupons Near You</h3>
                <p className="results-subtitle">{nearbyStores.length} stores found with available coupons</p>
                
                <div className="nearby-stores-list">
                  {nearbyStores.map(store => (
                    <div key={store.id} className="nearby-store-item">
                      <div className="store-info">
                        <span className="store-name-text" style={{color: store.color}}>{store.name}</span>
                        <span className="store-coupon-count">{store.coupons} coupons available</span>
                      </div>
                      <div className="store-coupon-badge">{store.coupons}</div>
                    </div>
                  ))}
                </div>
                
                <button className="btn-primary btn-block" onClick={onGetStarted}>
                  Select My Stores
                </button>
                <button className="btn-link" onClick={() => setLocationStatus("idle")}>
                  ← Try a different location
                </button>
              </div>
            )}
            
            {locationStatus === "error" && (
              <div className="location-error">
                <p>Couldn't detect your location. Please enter your ZIP code instead.</p>
                <form onSubmit={handleZipSubmit} className="zip-form">
                  <input 
                    type="text" 
                    placeholder="Enter ZIP code"
                    value={zipCode}
                    onChange={e => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    maxLength={5}
                  />
                  <button type="submit" className="btn-primary" disabled={zipCode.length !== 5}>
                    Find Stores
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

// Onboarding Page
const OnboardingPage = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedStores, setSelectedStores] = useState([]);
  const [manufacturerCoupons, setManufacturerCoupons] = useState(false);
  const [notificationMethod, setNotificationMethod] = useState("push");
  const [stores, setStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await axios.get(`${API}/stores`);
        setStores(response.data.stores);
      } catch (e) {
        console.error("Failed to fetch stores", e);
      }
    };
    fetchStores();
  }, []);
  
  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const toggleStore = (storeId) => {
    setSelectedStores(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };
  
  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email");
      return;
    }
    if (selectedStores.length === 0) {
      setError("Please select at least one store");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const userRes = await axios.post(`${API}/users`, { name, email });
      const userId = userRes.data.id;
      
      await axios.put(`${API}/users/${userId}/stores`, { store_ids: selectedStores });
      await axios.put(`${API}/users/${userId}/manufacturer-coupons`, { enabled: manufacturerCoupons });
      await axios.put(`${API}/users/${userId}/notification-method`, { method: notificationMethod });
      
      const updatedUser = await axios.get(`${API}/users/${userId}`);
      onComplete(updatedUser.data);
    } catch (e) {
      console.error("Failed to create user", e);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <div className="onboarding-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>
        
        {step === 1 && (
          <div className="onboarding-step" data-testid="onboarding-step-1">
            <h2>Let's get you set up</h2>
            <p className="step-subtitle">We just need a few details to start sending you coupons.</p>
            
            <div className="form-group">
              <label htmlFor="name">Your Name</label>
              <input 
                type="text" 
                id="name"
                value={name} 
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
                data-testid="input-name"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id="email"
                value={email} 
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                data-testid="input-email"
              />
            </div>
            
            {error && <p className="error-message">{error}</p>}
            
            <button 
              className="btn-primary btn-full" 
              onClick={() => {
                if (name.trim() && email.trim()) {
                  setError("");
                  setStep(2);
                } else {
                  setError("Please fill in all fields");
                }
              }}
              data-testid="btn-next-step"
            >
              Continue
            </button>
          </div>
        )}
        
        {step === 2 && (
          <div className="onboarding-step" data-testid="onboarding-step-2">
            <h2>Pick your stores</h2>
            <p className="step-subtitle">Select the stores you shop at. We'll bundle ALL available coupons into your weekly QR.</p>
            
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input 
                type="text"
                placeholder="Search stores..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                data-testid="store-search"
              />
            </div>
            
            <div className="selected-count">
              {selectedStores.length} store{selectedStores.length !== 1 ? 's' : ''} selected
            </div>
            
            <div className="store-grid" data-testid="store-grid">
              {filteredStores.map(store => (
                <div 
                  key={store.id}
                  className={`store-card ${selectedStores.includes(store.id) ? 'selected' : ''}`}
                  onClick={() => toggleStore(store.id)}
                  data-testid={`store-${store.id}`}
                >
                  <div className="store-logo">{store.logo}</div>
                  <div className="store-name">{store.name}</div>
                  {selectedStores.includes(store.id) && (
                    <div className="store-check">✓</div>
                  )}
                </div>
              ))}
            </div>
            
            {error && <p className="error-message">{error}</p>}
            
            <div className="step-actions">
              <button className="btn-text" onClick={() => setStep(1)}>Back</button>
              <button 
                className="btn-primary" 
                onClick={() => {
                  if (selectedStores.length > 0) {
                    setError("");
                    setStep(3);
                  } else {
                    setError("Please select at least one store");
                  }
                }}
                data-testid="btn-continue-stores"
              >
                Continue ({selectedStores.length} stores)
              </button>
            </div>
          </div>
        )}
        
        {step === 3 && (
          <div className="onboarding-step" data-testid="onboarding-step-3">
            <h2>Almost done!</h2>
            <p className="step-subtitle">Just a couple more options to customize your experience.</p>
            
            <div className="option-card" data-testid="manufacturer-toggle">
              <div className="option-info">
                <h4>🏭 Manufacturer Coupons</h4>
                <p>Get extra brand coupons (Coca-Cola, Kraft, P&G, etc.) that work at any retailer.</p>
              </div>
              <label className="toggle">
                <input 
                  type="checkbox" 
                  checked={manufacturerCoupons}
                  onChange={e => setManufacturerCoupons(e.target.checked)}
                  data-testid="checkbox-manufacturer"
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="option-section">
              <h4>How should we notify you when your weekly QR is ready?</h4>
              <div className="notification-options" data-testid="notification-options">
                <label className={`notification-option ${notificationMethod === 'push' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="notification" 
                    value="push"
                    checked={notificationMethod === 'push'}
                    onChange={e => setNotificationMethod(e.target.value)}
                  />
                  <span className="option-icon">📲</span>
                  <span className="option-label">Push Notification</span>
                </label>
                <label className={`notification-option ${notificationMethod === 'sms' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="notification" 
                    value="sms"
                    checked={notificationMethod === 'sms'}
                    onChange={e => setNotificationMethod(e.target.value)}
                  />
                  <span className="option-icon">💬</span>
                  <span className="option-label">Text Message</span>
                </label>
                <label className={`notification-option ${notificationMethod === 'email' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="notification" 
                    value="email"
                    checked={notificationMethod === 'email'}
                    onChange={e => setNotificationMethod(e.target.value)}
                  />
                  <span className="option-icon">📧</span>
                  <span className="option-label">Email</span>
                </label>
              </div>
            </div>
            
            {error && <p className="error-message">{error}</p>}
            
            <div className="step-actions">
              <button className="btn-text" onClick={() => setStep(2)}>Back</button>
              <button 
                className="btn-primary" 
                onClick={handleSubmit}
                disabled={loading}
                data-testid="btn-finish-setup"
              >
                {loading ? "Setting up..." : "Get My Coupons"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Dashboard Page - NEW SINGLE QR DESIGN
const DashboardPage = ({ user, onUpdateUser }) => {
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("coupons");
  const [showCoupons, setShowCoupons] = useState(false);
  const [stores, setStores] = useState([]);
  const [editingStores, setEditingStores] = useState(false);
  const [tempSelectedStores, setTempSelectedStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  
  const fetchBundle = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/users/${user.id}/bundle`);
      if (response.data.has_bundle) {
        setBundle(response.data.bundle);
      } else {
        setBundle(null);
      }
    } catch (e) {
      console.error("Failed to fetch bundle", e);
    } finally {
      setLoading(false);
    }
  }, [user.id]);
  
  const fetchStores = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/stores`);
      setStores(response.data.stores);
    } catch (e) {
      console.error("Failed to fetch stores", e);
    }
  }, []);
  
  useEffect(() => {
    fetchBundle();
    fetchStores();
  }, [fetchBundle, fetchStores]);
  
  const handleRefreshBundle = async () => {
    setRefreshing(true);
    try {
      const response = await axios.post(`${API}/users/${user.id}/bundle/refresh`);
      setBundle(response.data.bundle);
    } catch (e) {
      console.error("Failed to refresh bundle", e);
    } finally {
      setRefreshing(false);
    }
  };
  
  const toggleManufacturerCoupons = async () => {
    try {
      const response = await axios.put(`${API}/users/${user.id}/manufacturer-coupons`, {
        enabled: !user.manufacturer_coupons_enabled
      });
      onUpdateUser(response.data);
      fetchBundle();
    } catch (e) {
      console.error("Failed to toggle manufacturer coupons", e);
    }
  };
  
  const updateNotificationMethod = async (method) => {
    try {
      const response = await axios.put(`${API}/users/${user.id}/notification-method`, { method });
      onUpdateUser(response.data);
    } catch (e) {
      console.error("Failed to update notification method", e);
    }
  };
  
  const saveStoreSelections = async () => {
    try {
      const response = await axios.put(`${API}/users/${user.id}/stores`, {
        store_ids: tempSelectedStores
      });
      onUpdateUser(response.data);
      setEditingStores(false);
      fetchBundle();
    } catch (e) {
      console.error("Failed to update stores", e);
    }
  };
  
  const startEditingStores = () => {
    setTempSelectedStores([...user.selected_stores]);
    setEditingStores(true);
  };
  
  const toggleTempStore = (storeId) => {
    setTempSelectedStores(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };
  
  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSaveQR = () => {
    if (bundle?.qr_url) {
      // Open QR page in new tab for saving
      window.open(bundle.qr_url, '_blank');
    }
  };
  
  const formatValidUntil = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };
  
  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading-spinner">Loading your coupons...</div>
      </div>
    );
  }
  
  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="welcome-section">
            <h1 data-testid="dashboard-title">Hi, {user.name}! 👋</h1>
            <p className="tier-badge">{user.tier === 'premium' ? '⭐ Premium' : '🆓 Free Plan'}</p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="dashboard-tabs">
          <button 
            className={`tab ${activeTab === 'coupons' ? 'active' : ''}`}
            onClick={() => setActiveTab('coupons')}
            data-testid="tab-coupons"
          >
            📱 My Coupons
          </button>
          <button 
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            data-testid="tab-settings"
          >
            ⚙️ Settings
          </button>
        </div>
        
        {/* Coupons Tab - SINGLE MASTER QR */}
        {activeTab === 'coupons' && (
          <div className="coupons-tab" data-testid="coupons-view">
            {!bundle ? (
              <div className="empty-state">
                <div className="empty-icon">📱</div>
                <h3>No Active Bundle</h3>
                <p>Select stores in Settings to get your coupon bundle.</p>
                <button className="btn-primary" onClick={() => setActiveTab('settings')}>
                  Add Stores
                </button>
              </div>
            ) : (
              <div className="master-bundle-card" data-testid="master-bundle">
                {/* Bundle Header */}
                <div className="bundle-header">
                  <div className="bundle-week">
                    <span className="week-label">{bundle.week_label}</span>
                    <span className="bundle-type-badge">
                      {bundle.bundle_type === 'starter' ? '🚀 Starter Bundle' : '📅 Weekly Bundle'}
                    </span>
                  </div>
                  <div className="bundle-expiry">
                    Valid until {formatValidUntil(bundle.valid_until)}
                  </div>
                </div>
                
                {/* QR Code - MAIN FOCUS */}
                <div className="qr-section">
                  <div className="qr-wrapper">
                    <QRCodeDisplay bundleId={bundle.id} size={256} />
                  </div>
                  <p className="qr-instruction">Scan this QR code at checkout</p>
                  
                  {/* Fallback URL */}
                  <div className="qr-fallback">
                    <a 
                      href={getQRCodeUrl(bundle.id)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="qr-url-link"
                    >
                      {getQRCodeUrl(bundle.id)}
                    </a>
                  </div>
                  
                  {/* Test QR Button */}
                  <button 
                    className="btn-secondary test-qr-btn"
                    onClick={() => window.open(getQRCodeUrl(bundle.id), '_blank')}
                    data-testid="test-qr-btn"
                  >
                    🔗 Test QR Code Link
                  </button>
                </div>
                
                {/* Stats */}
                <div className="bundle-stats">
                  <div className="stat-item">
                    <span className="stat-number">{bundle.coupon_count}</span>
                    <span className="stat-text">Coupons</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <span className="stat-number">${bundle.total_savings}</span>
                    <span className="stat-text">Est. Savings</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <span className="stat-number">{bundle.stores_included?.length || 0}</span>
                    <span className="stat-text">Stores</span>
                  </div>
                </div>
                
                {/* Stores Included */}
                <div className="stores-included">
                  <h4>Stores Included</h4>
                  <div className="store-tags">
                    {bundle.stores_included?.map(store => (
                      <span key={store.id} className="store-tag" style={{borderColor: store.color}}>
                        {store.logo} {store.name}
                      </span>
                    ))}
                    {bundle.manufacturer_coupons_included && (
                      <span className="store-tag manufacturer">🏭 Manufacturer</span>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="bundle-actions">
                  <button className="btn-secondary" onClick={handleSaveQR}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Save QR to Phone
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={() => setShowCoupons(!showCoupons)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M9 5l7 7-7 7"/>
                    </svg>
                    {showCoupons ? 'Hide' : 'View'} Included Coupons
                  </button>
                </div>
                
                {/* Refresh Button */}
                <button 
                  className="btn-text refresh-btn" 
                  onClick={handleRefreshBundle}
                  disabled={refreshing}
                >
                  {refreshing ? '⟳ Refreshing...' : '⟳ Refresh QR Code'}
                </button>
                
                {/* Coupon List (expandable) */}
                {showCoupons && (
                  <div className="coupon-list-section">
                    <h4>Included Coupons ({bundle.coupon_count})</h4>
                    <div className="coupon-list">
                      {bundle.coupons?.map(coupon => (
                        <div key={coupon.id} className="coupon-item">
                          <div className="coupon-info">
                            <span className="coupon-store">
                              {coupon.store_id ? coupon.store_id.replace('-', ' ').toUpperCase() : 'MANUFACTURER'}
                            </span>
                            <span className="coupon-title">{coupon.title}</span>
                            <span className="coupon-desc">{coupon.description}</span>
                          </div>
                          <div className="coupon-savings">
                            {coupon.savings_type === 'dollar' && `$${coupon.savings_value}`}
                            {coupon.savings_type === 'percent' && `${coupon.savings_value}%`}
                            {coupon.savings_type === 'bogo' && 'BOGO'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="settings-tab" data-testid="settings-view">
            {/* Store Selection */}
            <div className="settings-section">
              <div className="section-header">
                <h2>🏪 My Stores</h2>
                {!editingStores && (
                  <button className="btn-text" onClick={startEditingStores} data-testid="btn-edit-stores">
                    Edit
                  </button>
                )}
              </div>
              
              {!editingStores ? (
                <div className="selected-stores-list">
                  {user.selected_stores.length === 0 ? (
                    <p className="empty-text">No stores selected yet</p>
                  ) : (
                    <div className="store-chips">
                      {user.selected_stores.map(storeId => {
                        const store = stores.find(s => s.id === storeId);
                        return store ? (
                          <span key={storeId} className="store-chip">
                            {store.logo} {store.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                  <button className="btn-secondary" onClick={startEditingStores}>
                    {user.selected_stores.length === 0 ? 'Add Stores' : 'Change Stores'}
                  </button>
                </div>
              ) : (
                <div className="store-editor" data-testid="store-editor">
                  <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input 
                      type="text"
                      placeholder="Search stores..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="store-grid compact">
                    {filteredStores.map(store => (
                      <div 
                        key={store.id}
                        className={`store-card ${tempSelectedStores.includes(store.id) ? 'selected' : ''}`}
                        onClick={() => toggleTempStore(store.id)}
                      >
                        <div className="store-logo">{store.logo}</div>
                        <div className="store-name">{store.name}</div>
                        {tempSelectedStores.includes(store.id) && (
                          <div className="store-check">✓</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="editor-actions">
                    <button className="btn-text" onClick={() => setEditingStores(false)}>Cancel</button>
                    <button className="btn-primary" onClick={saveStoreSelections}>
                      Save ({tempSelectedStores.length} stores)
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Manufacturer Coupons Toggle */}
            <div className="settings-section">
              <div className="option-card" data-testid="settings-manufacturer">
                <div className="option-info">
                  <h4>🏭 Manufacturer Coupons</h4>
                  <p>Include brand coupons (Tide, Coca-Cola, etc.) in your bundle.</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={user.manufacturer_coupons_enabled}
                    onChange={toggleManufacturerCoupons}
                    data-testid="toggle-manufacturer"
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            {/* Notification Method */}
            <div className="settings-section">
              <h3>📬 Notification Method</h3>
              <p className="section-desc">How should we notify you when your weekly QR is ready?</p>
              <div className="notification-options" data-testid="settings-notifications">
                <label className={`notification-option ${user.notification_method === 'push' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="notification" 
                    value="push"
                    checked={user.notification_method === 'push'}
                    onChange={e => updateNotificationMethod(e.target.value)}
                  />
                  <span className="option-icon">📲</span>
                  <span className="option-label">Push Notification</span>
                </label>
                <label className={`notification-option ${user.notification_method === 'sms' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="notification" 
                    value="sms"
                    checked={user.notification_method === 'sms'}
                    onChange={e => updateNotificationMethod(e.target.value)}
                  />
                  <span className="option-icon">💬</span>
                  <span className="option-label">Text Message</span>
                </label>
                <label className={`notification-option ${user.notification_method === 'email' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="notification" 
                    value="email"
                    checked={user.notification_method === 'email'}
                    onChange={e => updateNotificationMethod(e.target.value)}
                  />
                  <span className="option-icon">📧</span>
                  <span className="option-label">Email</span>
                </label>
              </div>
            </div>
            
            {/* Account Info */}
            <div className="settings-section">
              <h3>👤 Account</h3>
              <div className="account-info">
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Plan:</strong> {user.tier === 'premium' ? 'Premium' : 'Free'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============== MAIN APP ==============

function App() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const savedUserId = localStorage.getItem('scansavvy_user_id');
    if (savedUserId) {
      axios.get(`${API}/users/${savedUserId}`)
        .then(res => setUser(res.data))
        .catch(() => localStorage.removeItem('scansavvy_user_id'));
    }
  }, []);
  
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('scansavvy_user_id', userData.id);
  };
  
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('scansavvy_user_id');
    window.location.href = '/';
  };
  
  const handleUpdateUser = (userData) => {
    setUser(userData);
  };
  
  return (
    <div className="App">
      <BrowserRouter>
        <Header user={user} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={
            user ? (
              <DashboardPage user={user} onUpdateUser={handleUpdateUser} />
            ) : (
              <HomePage onGetStarted={() => window.location.href = '/onboarding'} />
            )
          } />
          <Route path="/onboarding" element={
            <OnboardingPage onComplete={(userData) => {
              handleLogin(userData);
              window.location.href = '/dashboard';
            }} />
          } />
          <Route path="/dashboard" element={
            user ? (
              <DashboardPage user={user} onUpdateUser={handleUpdateUser} />
            ) : (
              <OnboardingPage onComplete={(userData) => {
                handleLogin(userData);
                window.location.href = '/dashboard';
              }} />
            )
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
