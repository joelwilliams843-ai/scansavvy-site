import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ============== COMPONENTS ==============

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <header className="header">
      <nav className="navbar">
        <div className="logo-container" onClick={() => navigate("/")} style={{cursor: "pointer"}}>
          <img src="/assets/scansavvy-logo.png" alt="ScanSavvy" className="logo-image" />
          <h1>ScanSavvy</h1>
        </div>
        
        {!user && location.pathname === "/" && (
          <div className="nav-links">
            <a href="#how-it-works">How It Works</a>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
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

// QR Code Component
const QRCodeDisplay = ({ data, size = 200 }) => {
  // Generate a visual QR code pattern based on the data hash
  const generatePattern = () => {
    const cells = [];
    const gridSize = 21;
    const cellSize = size / gridSize;
    
    // Corner patterns (fixed)
    const cornerPositions = [
      {x: 0, y: 0}, {x: 14, y: 0}, {x: 0, y: 14}
    ];
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        // Check if in corner pattern
        let inCorner = false;
        for (const corner of cornerPositions) {
          if (x >= corner.x && x < corner.x + 7 && y >= corner.y && y < corner.y + 7) {
            inCorner = true;
            // Draw corner pattern
            const cx = x - corner.x;
            const cy = y - corner.y;
            if (cx === 0 || cx === 6 || cy === 0 || cy === 6 || 
                (cx >= 2 && cx <= 4 && cy >= 2 && cy <= 4)) {
              cells.push(
                <rect 
                  key={`${x}-${y}`} 
                  x={x * cellSize} 
                  y={y * cellSize} 
                  width={cellSize} 
                  height={cellSize} 
                  fill="#1A2E44"
                />
              );
            }
            break;
          }
        }
        
        if (!inCorner) {
          // Use data hash to determine if cell is filled
          const hash = data.charCodeAt((x * y + x + y) % data.length);
          if (hash % 3 !== 0) {
            cells.push(
              <rect 
                key={`${x}-${y}`} 
                x={x * cellSize} 
                y={y * cellSize} 
                width={cellSize} 
                height={cellSize} 
                fill="#1A2E44"
                rx={1}
              />
            );
          }
        }
      }
    }
    
    return cells;
  };
  
  return (
    <div className="qr-code-container">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect width={size} height={size} fill="white" rx="8"/>
        {generatePattern()}
        {/* Center logo */}
        <rect x={size/2 - 20} y={size/2 - 20} width="40" height="40" fill="white" rx="4"/>
        <rect x={size/2 - 16} y={size/2 - 16} width="32" height="32" fill="#3EBCAB" rx="4"/>
        <text x={size/2} y={size/2 + 6} textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">S</text>
      </svg>
    </div>
  );
};

// ============== PAGES ==============

const HomePage = ({ onGetStarted }) => {
  // Store logo data with real brand colors
  const storeLogos = [
    { name: "Walmart", color: "#0071CE", letter: "W" },
    { name: "Target", color: "#CC0000", letter: "T" },
    { name: "Kroger", color: "#0D47A1", letter: "K" },
    { name: "CVS", color: "#CC0000", letter: "CVS" },
    { name: "Walgreens", color: "#E31837", letter: "W" },
    { name: "Costco", color: "#E31837", letter: "C" },
    { name: "Publix", color: "#3B8C3B", letter: "P" },
    { name: "Aldi", color: "#00529B", letter: "A" },
  ];

  return (
    <main className="home-page">
      {/* Hero Section - Polished */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span>🎉</span> Over $2M saved by ScanSavvy users
          </div>
          <h2 data-testid="hero-title">All Your Coupons.<br/>One QR Code.</h2>
          <p data-testid="hero-subtitle">
            Choose your favorite stores and brands. ScanSavvy sends deals directly to your phone every week. At checkout, just scan once and save.
          </p>
          <div className="hero-actions">
            <button className="btn-primary btn-large" onClick={onGetStarted} data-testid="hero-cta">
              Start Saving Now
            </button>
            <a href="#how-it-works" className="btn-ghost btn-large" data-testid="hero-learn-more">
              See How It Works →
            </a>
          </div>
          <div className="hero-trust">
            <div className="trust-item">
              <span className="trust-check">✓</span>
              <span>Free forever plan</span>
            </div>
            <div className="trust-item">
              <span className="trust-check">✓</span>
              <span>No credit card required</span>
            </div>
            <div className="trust-item">
              <span className="trust-check">✓</span>
              <span>Works at 20+ stores</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-phone-container">
            <div className="phone-glow"></div>
            <div className="phone-mockup">
              <div className="phone-notch"></div>
              <div className="phone-screen">
                <div className="phone-header">
                  <span className="phone-time">9:41</span>
                  <div className="phone-status">
                    <span>📶</span>
                    <span>🔋</span>
                  </div>
                </div>
                <div className="app-header">
                  <img src="/assets/scansavvy-logo.png" alt="" className="app-logo-mini" />
                  <span>My Coupons</span>
                </div>
                <div className="qr-card-preview">
                  <div className="qr-card-header">
                    <span className="qr-store-icon">🎯</span>
                    <div className="qr-store-info">
                      <span className="qr-store-name">Target</span>
                      <span className="qr-store-count">12 coupons ready</span>
                    </div>
                  </div>
                  <div className="qr-code-wrapper">
                    <QRCodeDisplay data="SCANSAVVY-TARGET-2024" size={140} />
                  </div>
                  <div className="qr-card-footer">
                    <span className="qr-savings">Save up to $24.50</span>
                    <span className="qr-expiry">Valid this week</span>
                  </div>
                </div>
                <div className="more-stores-preview">
                  <div className="store-pill walmart">
                    <span>🛒</span> Walmart
                    <span className="pill-badge">8</span>
                  </div>
                  <div className="store-pill cvs">
                    <span>💊</span> CVS
                    <span className="pill-badge">5</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="floating-notification slide-in">
            <div className="notif-dot"></div>
            <div className="notif-content">
              <strong>Your weekly coupons are ready!</strong>
              <span>$47.25 in savings waiting for you</span>
            </div>
          </div>
        </div>
      </section>

      {/* Store Logos Section */}
      <section className="stores-banner">
        <p className="stores-label">Works with your favorite stores</p>
        <div className="store-logos-row">
          {storeLogos.map((store, i) => (
            <div key={i} className="store-logo-item" style={{'--brand-color': store.color}}>
              <div className="store-logo-circle">
                <span>{store.letter}</span>
              </div>
              <span className="store-logo-name">{store.name}</span>
            </div>
          ))}
          <div className="store-logo-item more">
            <div className="store-logo-circle">
              <span>+12</span>
            </div>
            <span className="store-logo-name">more</span>
          </div>
        </div>
      </section>

      {/* How It Works - Simplified */}
      <section className="how-it-works" id="how-it-works">
        <div className="section-header">
          <span className="section-label">Simple Process</span>
          <h2 className="section-title" data-testid="how-it-works-title">How ScanSavvy Works</h2>
          <p className="section-subtitle">Three simple steps to start saving every week</p>
        </div>
        <div className="steps-container">
          <div className="step-card" data-testid="step-1">
            <div className="step-number-badge">1</div>
            <div className="step-visual">
              <div className="step-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
            </div>
            <h3>Pick Your Stores</h3>
            <p>Select from Walmart, Target, Kroger, CVS, and 20+ other stores you shop at regularly.</p>
          </div>
          <div className="step-connector">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
          <div className="step-card" data-testid="step-2">
            <div className="step-number-badge">2</div>
            <div className="step-visual">
              <div className="step-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <rect x="7" y="7" width="3" height="3"/>
                  <rect x="14" y="7" width="3" height="3"/>
                  <rect x="7" y="14" width="3" height="3"/>
                  <rect x="14" y="14" width="3" height="3"/>
                </svg>
              </div>
            </div>
            <h3>Get Your QR Code</h3>
            <p>We bundle ALL available coupons for your stores into one QR code, delivered to you weekly.</p>
          </div>
          <div className="step-connector">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
          <div className="step-card" data-testid="step-3">
            <div className="step-number-badge">3</div>
            <div className="step-visual">
              <div className="step-icon-box green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
            </div>
            <h3>Scan & Save</h3>
            <p>At checkout, show your QR code. All your coupons apply instantly. That's it!</p>
          </div>
        </div>
      </section>

      {/* Features - Cleaner Grid */}
      <section className="features" id="features">
        <div className="section-header">
          <span className="section-label">Why Choose Us</span>
          <h2 className="section-title" data-testid="features-title">Everything You Need to Save</h2>
        </div>
        <div className="features-grid">
          <div className="feature-card" data-testid="feature-automatic">
            <div className="feature-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <h3>Automatic Updates</h3>
            <p>Fresh coupons delivered to you every week. No searching required.</p>
          </div>
          <div className="feature-card" data-testid="feature-all-coupons">
            <div className="feature-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 21V9"/>
              </svg>
            </div>
            <h3>Every Coupon</h3>
            <p>We find ALL available coupons—never miss a deal again.</p>
          </div>
          <div className="feature-card" data-testid="feature-one-qr">
            <div className="feature-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
              </svg>
            </div>
            <h3>One QR Code</h3>
            <p>All your coupons in a single scan. Fast and effortless checkout.</p>
          </div>
          <div className="feature-card" data-testid="feature-manufacturer">
            <div className="feature-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 7h-9"/>
                <path d="M14 17H5"/>
                <circle cx="17" cy="17" r="3"/>
                <circle cx="7" cy="7" r="3"/>
              </svg>
            </div>
            <h3>Brand Coupons</h3>
            <p>Manufacturer coupons from top brands—extra savings everywhere.</p>
          </div>
          <div className="feature-card" data-testid="feature-notifications">
            <div className="feature-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
            </div>
            <h3>Smart Alerts</h3>
            <p>Get notified via push, text, or email—your choice.</p>
          </div>
          <div className="feature-card" data-testid="feature-easy">
            <div className="feature-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h3>Zero Effort</h3>
            <p>Set it once, forget it. Savings come to you automatically.</p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="social-proof">
        <div className="proof-stats">
          <div className="stat-item">
            <span className="stat-number">50K+</span>
            <span className="stat-label">Active Users</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">$2M+</span>
            <span className="stat-label">Saved This Year</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">4.8★</span>
            <span className="stat-label">App Store Rating</span>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing" id="pricing">
        <div className="section-header">
          <span className="section-label">Pricing</span>
          <h2 className="section-title" data-testid="pricing-title">Simple, Transparent Pricing</h2>
          <p className="section-subtitle">Save more than the cost of any plan, guaranteed.</p>
        </div>
        <div className="pricing-cards">
          <div className="pricing-card" data-testid="pricing-free">
            <h3>Free</h3>
            <div className="price">$0<span>/month</span></div>
            <p className="price-desc">Perfect for trying it out</p>
            <ul className="plan-features">
              <li>Up to 3 store selections</li>
              <li>Weekly QR code bundles</li>
              <li>Push notifications</li>
              <li>Basic savings dashboard</li>
            </ul>
            <button className="btn-secondary btn-full" onClick={onGetStarted}>Get Started Free</button>
          </div>
          <div className="pricing-card featured" data-testid="pricing-premium">
            <div className="popular-badge">Most Popular</div>
            <h3>Premium</h3>
            <div className="price">$3.99<span>/month</span></div>
            <p className="price-desc">For regular shoppers</p>
            <ul className="plan-features">
              <li>Unlimited store selections</li>
              <li>Weekly QR code bundles</li>
              <li>Manufacturer coupons included</li>
              <li>SMS, push, or email delivery</li>
              <li>Priority new coupon alerts</li>
              <li>Full savings dashboard</li>
            </ul>
            <button className="btn-primary btn-full" onClick={onGetStarted}>Start 14-Day Trial</button>
          </div>
          <div className="pricing-card" data-testid="pricing-family">
            <h3>Family</h3>
            <div className="price">$5.99<span>/month</span></div>
            <p className="price-desc">For the whole household</p>
            <ul className="plan-features">
              <li>Everything in Premium</li>
              <li>Up to 5 family members</li>
              <li>Shared coupon wallets</li>
              <li>Family savings tracking</li>
              <li>Household spending insights</li>
            </ul>
            <button className="btn-secondary btn-full" onClick={onGetStarted}>Get Family Plan</button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 data-testid="cta-title">Start Saving in 30 Seconds</h2>
          <p>Pick your stores, get your QR code, and never clip another coupon again.</p>
          <button className="btn-primary btn-large btn-white" onClick={onGetStarted} data-testid="cta-button">
            Get Your Free Coupons
          </button>
          <span className="cta-note">No credit card required • Free forever plan available</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo-container">
              <img src="/assets/scansavvy-logo.png" alt="ScanSavvy" className="footer-logo" />
              <span>ScanSavvy</span>
            </div>
            <p>All your coupons. One QR code.</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#how-it-works">How It Works</a>
            </div>
            <div className="footer-col">
              <h4>Support</h4>
              <a href="#">Help Center</a>
              <a href="#">Contact Us</a>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 ScanSavvy. All rights reserved.</p>
        </div>
      </footer>
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
      // Create user
      const userRes = await axios.post(`${API}/users`, { name, email });
      const userId = userRes.data.id;
      
      // Update store selections
      await axios.put(`${API}/users/${userId}/stores`, { store_ids: selectedStores });
      
      // Update manufacturer coupons
      await axios.put(`${API}/users/${userId}/manufacturer-coupons`, { enabled: manufacturerCoupons });
      
      // Update notification method
      await axios.put(`${API}/users/${userId}/notification-method`, { method: notificationMethod });
      
      // Fetch updated user
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
            <p className="step-subtitle">Select the stores you shop at. We'll collect ALL available coupons for each one.</p>
            
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
              <h4>How should we send your weekly coupons?</h4>
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

// Dashboard Page
const DashboardPage = ({ user, onUpdateUser }) => {
  const [bundles, setBundles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("coupons");
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [stores, setStores] = useState([]);
  const [editingStores, setEditingStores] = useState(false);
  const [tempSelectedStores, setTempSelectedStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const fetchBundles = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/users/${user.id}/coupon-bundles`);
      setBundles(response.data);
    } catch (e) {
      console.error("Failed to fetch bundles", e);
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
    fetchBundles();
    fetchStores();
  }, [fetchBundles, fetchStores]);
  
  const toggleManufacturerCoupons = async () => {
    try {
      const response = await axios.put(`${API}/users/${user.id}/manufacturer-coupons`, {
        enabled: !user.manufacturer_coupons_enabled
      });
      onUpdateUser(response.data);
      fetchBundles();
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
      fetchBundles();
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
  
  const totalSavings = bundles?.store_bundles?.reduce((sum, b) => {
    const val = parseFloat(b.total_savings.replace("$", "").replace("+", ""));
    return sum + val;
  }, 0) || 0;
  
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
            <p className="week-label">Week of {bundles?.week_of}</p>
          </div>
          <div className="savings-summary">
            <div className="savings-card">
              <span className="savings-label">This Week's Savings</span>
              <span className="savings-amount" data-testid="total-savings">${totalSavings.toFixed(2)}+</span>
            </div>
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
        
        {/* Coupons Tab */}
        {activeTab === 'coupons' && !selectedBundle && (
          <div className="coupons-tab" data-testid="coupons-view">
            <div className="section-header">
              <h2>Your Weekly QR Bundles</h2>
              <p>Each QR code contains ALL available coupons for that store. Scan at checkout to save!</p>
            </div>
            
            {bundles?.store_bundles?.length === 0 ? (
              <div className="empty-state">
                <p>No stores selected yet. Add stores in Settings to get your coupons!</p>
                <button className="btn-primary" onClick={() => setActiveTab('settings')}>
                  Add Stores
                </button>
              </div>
            ) : (
              <div className="bundle-grid" data-testid="bundle-grid">
                {bundles?.store_bundles?.map(bundle => (
                  <div 
                    key={bundle.id} 
                    className="bundle-card"
                    onClick={() => setSelectedBundle(bundle)}
                    data-testid={`bundle-${bundle.store_id}`}
                  >
                    <div className="bundle-store">
                      <span className="store-logo">{bundle.store_logo}</span>
                      <span className="store-name">{bundle.store_name}</span>
                    </div>
                    <div className="bundle-qr-preview">
                      <QRCodeDisplay data={bundle.qr_code_data} size={120} />
                    </div>
                    <div className="bundle-info">
                      <span className="coupon-count">{bundle.coupon_count} coupons</span>
                      <span className="savings-badge">{bundle.total_savings} savings</span>
                    </div>
                    <div className="bundle-expiry">Valid until {bundle.valid_until}</div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Manufacturer Coupons */}
            {bundles?.manufacturer_bundle && (
              <div className="manufacturer-section">
                <div className="section-header">
                  <h2>🏭 Manufacturer Coupons</h2>
                  <p>Brand coupons that work at any store</p>
                </div>
                <div 
                  className="bundle-card manufacturer"
                  onClick={() => setSelectedBundle({...bundles.manufacturer_bundle, isManufacturer: true})}
                  data-testid="manufacturer-bundle"
                >
                  <div className="bundle-store">
                    <span className="store-logo">🏭</span>
                    <span className="store-name">Manufacturer Coupons</span>
                  </div>
                  <div className="bundle-qr-preview">
                    <QRCodeDisplay data={bundles.manufacturer_bundle.qr_code_data} size={120} />
                  </div>
                  <div className="bundle-info">
                    <span className="coupon-count">{bundles.manufacturer_bundle.coupon_count} coupons</span>
                    <span className="savings-badge">{bundles.manufacturer_bundle.total_savings} savings</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Selected Bundle View */}
        {activeTab === 'coupons' && selectedBundle && (
          <div className="bundle-detail" data-testid="bundle-detail">
            <button className="back-button" onClick={() => setSelectedBundle(null)}>
              ← Back to all coupons
            </button>
            
            <div className="bundle-detail-header">
              <h2>
                {selectedBundle.isManufacturer ? '🏭 Manufacturer Coupons' : `${selectedBundle.store_logo} ${selectedBundle.store_name}`}
              </h2>
              <p>{selectedBundle.coupon_count} coupons • {selectedBundle.total_savings} potential savings</p>
            </div>
            
            <div className="qr-display-section">
              <div className="qr-large">
                <QRCodeDisplay data={selectedBundle.qr_code_data} size={280} />
              </div>
              <p className="qr-instruction">Show this QR code at checkout</p>
              <p className="qr-validity">Valid until {selectedBundle.valid_until}</p>
            </div>
            
            <div className="coupon-list">
              <h3>Included Coupons</h3>
              {selectedBundle.coupons.map(coupon => (
                <div key={coupon.id} className="coupon-item">
                  <div className="coupon-info">
                    <span className="coupon-title">{coupon.title}</span>
                    <span className="coupon-desc">{coupon.description}</span>
                  </div>
                  <div className="coupon-savings">{coupon.savings}</div>
                </div>
              ))}
            </div>
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
                  <p>Receive extra brand coupons that work at any retailer.</p>
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
              <p className="section-desc">How should we send your weekly coupons?</p>
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
          </div>
        )}
      </div>
    </div>
  );
};

// ============== MAIN APP ==============

function App() {
  const [user, setUser] = useState(null);
  
  // Check for saved user on mount
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
