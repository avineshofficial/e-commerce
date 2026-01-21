import React from 'react';
import { FaShippingFast, FaUndoAlt, FaHeadset, FaMedal } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../../styles/About.css';

const About = () => {
  return (
    <div className="container about-container" style={{ padding: '30px 15px' }}>
      
      {/* 1. Hero Section */}
      <div className="about-hero">
        <h1>Our Story</h1>
        <p>
          Founded in 2024, NK Enterpriceses has come a long way from its beginnings. 
          When we first started out, our passion for "quality products for everyone" 
          drove us to start this journey.
        </p>
      </div>

      {/* 2. Key Features */}
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <FaShippingFast />
          </div>
          <h3>Fast Delivery</h3>
          <p>We partner with premium couriers to ensure your products reach you on time, every time.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <FaMedal />
          </div>
          <h3>Top Quality</h3>
          <p>We strictly verify every product before it lists. Quality is our main priority.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
            <FaHeadset />
          </div>
          <h3>24/7 Support</h3>
          <p>Got a question? Our support team is just one message away, ready to help you.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <FaUndoAlt />
          </div>
          <h3>Easy Returns</h3>
          <p>Changed your mind? Return unused items within 7 days for a hassle-free refund.</p>
        </div>
      </div>

      {/* 3. Company Story */}
      <div className="story-section">
        <div className="story-image">
          <img 
            src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
            alt="Office" 
          />
        </div>
        <div className="story-content">
          <h2>Who We Are</h2>
          <p>
            NK Enterpriceses isn't just an e-commerce platform; it's a promise of reliability.
            We serve customers all over India and are thrilled to be part of the quirky, eco-friendly 
            wing of the fashion and electronics industry.
          </p>
          <p>
            We hope you enjoy our products as much as we enjoy offering them to you. 
            If you have any questions or comments, please don't hesitate to contact us.
          </p>
          <Link to="/contact" className="btn" style={{ display: 'inline-block', marginTop: '10px' }}>
            Contact Us
          </Link>
        </div>
      </div>

      {/* 4. Stats Counter */}
      <div className="stats-row">
        <div className="stat-item">
          <h2>5K+</h2>
          <p>Happy Customers</p>
        </div>
        <div className="stat-item">
          <h2>100+</h2>
          <p>Premium Products</p>
        </div>
        <div className="stat-item">
          <h2>15+</h2>
          <p>Cities Served</p>
        </div>
        <div className="stat-item">
          <h2>24h</h2>
          <p>Average Shipping</p>
        </div>
      </div>

      {/* 5. Team Snippet (Optional) */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Meet The Founder</h2>
        <div style={{ width: '100px', height: '100px', margin: '20px auto', borderRadius: '50%', background: '#ccc', overflow:'hidden' }}>
          <img src="https://via.placeholder.com/100" alt="Founder" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h4 style={{ margin: 0 }}>N. Kumar</h4>
        <p style={{ color: '#666', marginTop: '5px' }}>CEO & Founder</p>
      </div>

    </div>
  );
};

export default About;