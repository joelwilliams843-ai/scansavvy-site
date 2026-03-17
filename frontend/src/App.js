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
          <div className="logo-icon">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="#3EBCAB"/>
              <rect x="8" y="8" width="10" height="10" rx="2" fill="white"/>
              <rect x="22" y="8" width="10" height="10" rx="2" fill="white"/>
              <rect x="8" y="22" width="10" height="10" rx="2" fill="white"/>
              <rect x="22" y="22" width="6" height="6" rx="1" fill="white"/>
              <rect x="28" y="26" width="4" height="6" rx="1" fill="white"/>
              <rect x="22" y="28" width="6" height="4" rx="1" fill="white"/>
            </svg>
          </div>
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
              Get My Coupons
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
  return (
    <main className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h2 data-testid="hero-title">Pick Your Stores.<br/>Get Every Coupon Sent to Your Phone.</h2>
          <p data-testid="hero-subtitle">
            Select the stores you shop at most. ScanSavvy collects all available coupons and delivers them 
            automatically as a weekly QR code bundle. Just scan at checkout and save.
          </p>
          <div className="hero-actions">
            <button className="btn-primary btn-large" onClick={onGetStarted} data-testid="hero-cta">
              Get My Coupons
            </button>
            <a href="#how-it-works" className="btn-secondary btn-large" data-testid="hero-learn-more">
              See How It Works
            </a>
          </div>
          <div className="hero-trust">
            <span className="trust-badge">✓ Free to start</span>
            <span className="trust-badge">✓ Updates weekly</span>
            <span className="trust-badge">✓ Works at 20+ stores</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="phone-mockup">
            <div className="phone-screen">
              <div className="qr-preview">
                <QRCodeDisplay data="SCANSAVVY-DEMO-2024" size={180} />
                <div className="qr-label">Your Weekly Coupons</div>
              </div>
              <div className="coupon-preview-list">
                <div className="coupon-mini"><span>Target</span><span className="savings">$12.50 savings</span></div>
                <div className="coupon-mini"><span>Walmart</span><span className="savings">$8.75 savings</span></div>
                <div className="coupon-mini"><span>CVS</span><span className="savings">$5.00 savings</span></div>
              </div>
            </div>
          </div>
          <div className="floating-notification">
            <div className="notif-icon">🔔</div>
            <div className="notif-text">
              <strong>Your weekly savings are ready!</strong>
              <span>15 new coupons for your stores</span>
            </div>
          </div>
        </div>
      </section>

      {/* Value Prop */}
      <section className="value-banner">
        <p>All your store coupons. One weekly QR code. Zero effort.</p>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <h2 className="section-title" data-testid="how-it-works-title">How It Works</h2>
        <div className="steps-container">
          <div className="step" data-testid="step-1">
            <div className="step-number">1</div>
            <div className="step-icon">🏪</div>
            <h3>Pick Your Stores</h3>
            <p>Select from Walmart, Target, Kroger, CVS, and 20+ other stores you actually shop at.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step" data-testid="step-2">
            <div className="step-number">2</div>
            <div className="step-icon">📲</div>
            <h3>Get Your QR Bundle</h3>
            <p>We collect ALL available coupons for your stores and bundle them into one QR code, updated weekly.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step" data-testid="step-3">
            <div className="step-number">3</div>
            <div className="step-icon">💰</div>
            <h3>Scan & Save</h3>
            <p>Show your QR code at checkout. The savings apply automatically. That's it.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <h2 className="section-title" data-testid="features-title">Why ScanSavvy?</h2>
        <div className="features-grid">
          <div className="feature-card" data-testid="feature-automatic">
            <div className="feature-icon">🔄</div>
            <h3>Automatic Weekly Updates</h3>
            <p>Your coupons refresh every week with the newest deals—no searching, no clipping.</p>
          </div>
          <div className="feature-card" data-testid="feature-all-coupons">
            <div className="feature-icon">📋</div>
            <h3>Every Available Coupon</h3>
            <p>We bundle ALL store coupons together. No more missing deals you didn't know about.</p>
          </div>
          <div className="feature-card" data-testid="feature-one-qr">
            <div className="feature-icon">📱</div>
            <h3>One QR Code Per Store</h3>
            <p>One scan applies all your coupons. Simple, fast, and works at checkout.</p>
          </div>
          <div className="feature-card" data-testid="feature-manufacturer">
            <div className="feature-icon">🏭</div>
            <h3>Manufacturer Coupons</h3>
            <p>Opt in to receive extra brand coupons that work at any retailer—even more savings.</p>
          </div>
          <div className="feature-card" data-testid="feature-notifications">
            <div className="feature-icon">🔔</div>
            <h3>Get Notified Your Way</h3>
            <p>Receive your weekly bundle via text, push notification, or email—your choice.</p>
          </div>
          <div className="feature-card" data-testid="feature-easy">
            <div className="feature-icon">✨</div>
            <h3>Effortless Savings</h3>
            <p>Set it once and forget it. Your coupons come to you automatically.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing" id="pricing">
        <h2 className="section-title" data-testid="pricing-title">Simple, Affordable Pricing</h2>
        <p className="pricing-subtitle">Save way more than the cost of any plan.</p>
        <div className="pricing-cards">
          <div className="pricing-card" data-testid="pricing-free">
            <h3>Free</h3>
            <div className="price">$0<span>/month</span></div>
            <p className="price-desc">Perfect for trying it out</p>
            <ul className="plan-features">
              <li>Up to 3 store selections</li>
              <li>Weekly QR code bundles</li>
              <li>Push notifications</li>
              <li>Basic dashboard</li>
            </ul>
            <button className="btn-secondary" onClick={onGetStarted}>Start Free</button>
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
            <button className="btn-primary" onClick={onGetStarted}>Get Premium</button>
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
            <button className="btn-secondary" onClick={onGetStarted}>Get Family</button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 data-testid="cta-title">Ready to Save Without the Hassle?</h2>
          <p>Pick your stores in 30 seconds. Start getting your weekly coupon bundles.</p>
          <button className="btn-primary btn-large" onClick={onGetStarted} data-testid="cta-button">
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo-container">
              <div className="logo-icon small">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="40" height="40" rx="10" fill="#3EBCAB"/>
                  <rect x="8" y="8" width="10" height="10" rx="2" fill="white"/>
                  <rect x="22" y="8" width="10" height="10" rx="2" fill="white"/>
                  <rect x="8" y="22" width="10" height="10" rx="2" fill="white"/>
                  <rect x="22" y="22" width="6" height="6" rx="1" fill="white"/>
                </svg>
              </div>
              <span>ScanSavvy</span>
            </div>
            <p>Your coupons, delivered automatically.</p>
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
              <a href="#">Contact</a>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
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
