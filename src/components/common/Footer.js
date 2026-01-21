import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import '../../styles/Footer.css'; // Import the new styles

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        
        {/* Column 1: Brand Info */}
        <div className="footer-section">
          <h3>NK Enterpriceses</h3>
          <p>
            Your premium destination for high-quality electronics, fashion, and accessories. 
            Verified quality, fast shipping, and secure payments.
          </p>
          <div className="social-links">
            <FaFacebook className="social-icon" />
            <FaTwitter className="social-icon" />
            <FaInstagram className="social-icon" />
            <FaLinkedin className="social-icon" />
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>     
            <li><Link to="/offers">Deals & Offers</Link></li>            
            <li><Link to="/legal" state={{ tab: 'terms' }}>Terms of Service</Link></li>
            <li><Link to="/help">Help Center / FAQs</Link></li>
            <li><Link to="/about">About Us</Link></li>
    
          </ul>
        </div>

        {/* Column 3: Contact */}
        <div className="footer-section">
          <h3>Contact Us</h3>
          <ul>
            <li><strong>Address:</strong> 123 Tech Park, Mumbai, India</li>
            <li><strong>Phone:</strong> +91 98765 43210</li>
            <li><strong>Email:</strong> support@nkenterprises.com</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} NK Enterpriceses. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;