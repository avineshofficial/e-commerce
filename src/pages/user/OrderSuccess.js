import React, { useEffect } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { FaBoxOpen, FaArrowRight } from 'react-icons/fa';
import '../../styles/Success.css';

const OrderSuccess = () => {
  const location = useLocation();
  const orderId = location.state?.orderId; // Passed from Checkout

  // Prevent users from accessing this page directly without placing an order
  if (!orderId) {
    return <Navigate to="/" />;
  }

  return (
    <div className="container success-container">
      
      {/* Animated Checkmark */}
      <div className="checkmark-circle">
        <div className="background"></div>
        <div className="checkmark draw"></div>
      </div>

      <div className="success-text">
        <h2>Order Placed Successfully!</h2>
        <p>Thank you for shopping with NK Enterpriceses. Your order is confirmed.</p>
        
        <div style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#6b7280' }}>
          Your Order ID:
        </div>
        <div className="order-id-box">
          {orderId}
        </div>
      </div>

      <div className="success-actions">
        <Link to="/dashboard" className="btn secondary" style={{ color: 'var(--text-main)', border: '1px solid #e5e7eb' }}>
          <FaBoxOpen /> View Order Status
        </Link>
        
        <Link to="/" className="btn">
          Continue Shopping <FaArrowRight style={{ marginLeft: '5px' }} />
        </Link>
      </div>

    </div>
  );
};

export default OrderSuccess;