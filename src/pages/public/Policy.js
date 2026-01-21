import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../../styles/Legal.css';

const Policy = () => {
  const [activeTab, setActiveTab] = useState('terms');
  const location = useLocation();

  // If redirected with state (e.g., from Footer), switch to that tab
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location]);

  return (
    <div className="container">
      <div className="legal-container">
        
        {/* Sidebar Navigation */}
        <div className="legal-sidebar">
          <button 
            className={`legal-tab ${activeTab === 'terms' ? 'active' : ''}`}
            onClick={() => setActiveTab('terms')}
          >
            Terms of Service
          </button>
          <button 
            className={`legal-tab ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            Privacy Policy
          </button>
          <button 
            className={`legal-tab ${activeTab === 'shipping' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipping')}
          >
            Shipping Policy
          </button>
          <button 
            className={`legal-tab ${activeTab === 'returns' ? 'active' : ''}`}
            onClick={() => setActiveTab('returns')}
          >
            Refunds & Returns
          </button>
        </div>

        {/* Content Area */}
        <div className="legal-content">
          
          {/* TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div>
              <h1>Terms of Service</h1>
              <p>Welcome to NK Enterprises. By accessing our website, you agree to these terms.</p>
              
              <h3>1. General Usage</h3>
              <p>Users are responsible for maintaining the confidentiality of their account credentials. You must be at least 18 years old to use our services.</p>
              
              <h3>2. Products & Pricing</h3>
              <p>We try our best to ensure accuracy, but prices and availability are subject to change without notice. NK Enterprises reserves the right to cancel orders due to pricing errors.</p>
              
              <h3>3. Intellectual Property</h3>
              <p>All content, including logos (NK Enterprises), images, and text, are the property of NK Enterprises and protected by copyright laws.</p>
            </div>
          )}

          {/* PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div>
              <h1>Privacy Policy</h1>
              <p>Your privacy is important to us. This policy outlines how we collect and use your data.</p>
              
              <h3>1. Information Collection</h3>
              <p>We collect personal information such as name, phone number (for authentication), address (for shipping), and order history.</p>
              
              <h3>2. Data Usage</h3>
              <p>We use your data solely to process orders, improve our store, and communicate status updates. We do not sell your data to third parties.</p>
              
              <h3>3. Cookies</h3>
              <p>We use local storage to remember your cart and user session. You can clear this in your browser settings at any time.</p>
            </div>
          )}

          {/* SHIPPING */}
          {activeTab === 'shipping' && (
            <div>
              <h1>Shipping Policy</h1>
              <p>We strive to deliver products as fast as possible across India.</p>
              
              <ul>
                <li><strong>Processing Time:</strong> 1-2 Business Days.</li>
                <li><strong>Delivery Time:</strong> 3-7 Business Days depending on location.</li>
                <li><strong>Carriers:</strong> We partner with trusted courier services for safe delivery.</li>
              </ul>
              
              <h3>Tracking</h3>
              <p>Once shipped, tracking details will be available in your Order History dashboard.</p>
            </div>
          )}

          {/* REFUNDS */}
          {activeTab === 'returns' && (
            <div>
              <h1>Returns & Refund Policy</h1>
              <p>Customer satisfaction is our priority. If you are not happy with your product, please review our policy below.</p>
              
              <h3>1. Return Window</h3>
              <p>You may request a return within <strong>7 days</strong> of delivery if the product is defective or damaged.</p>
              
              <h3>2. Refund Process</h3>
              <p>Refunds will be processed to the original payment method or as store credit within 5-7 working days after we receive the return item.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Policy;