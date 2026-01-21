import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// Added FaChevronDown
import { FaShoppingCart, FaUserCircle, FaUser, FaBoxOpen, FaCog, FaSignOutAlt, FaChartLine, FaHeart, FaSearchLocation, FaChevronDown } from 'react-icons/fa';
import { auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import '../../styles/Header.css';

const Header = () => {
  const { currentUser, logout, userRole } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      setShowDropdown(false);
    } catch (error) { console.error("Logout error", error); }
  };

  const handleNavigate = (path) => {
    navigate(path);
    setShowDropdown(false);
  };

  const cartCount = cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <header>
      <Link to="/" className="brand-wrapper">
        <div className="logo-circle">
          <span className="logo-initials">NK</span>
        </div>
        <div className="logo-text">
          <span className="logo-main">Enterprises</span>
        </div>
      </Link>

      <div className="header-right">
        <Link to="/cart" style={{ color: 'white', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <FaShoppingCart size={24} />
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </Link>

        {currentUser ? (
          <div className="user-menu" ref={dropdownRef}>
            {/* UPDATED TRIGGER WITH ARROW */}
            <div 
              onClick={() => setShowDropdown(!showDropdown)} 
              className="user-icon-trigger" 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="Profile" 
                  style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.8)', objectFit: 'cover' }} 
                />
              ) : (
                <FaUserCircle size={30} />
              )}
              
              {/* THE DOWN ARROW SYMBOL */}
              <FaChevronDown size={12} style={{ color: 'white', opacity: 0.9 }} />
            </div>

            {showDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  Hello, {currentUser.displayName?.split(' ')[0] || 'User'}
                  <small style={{overflow:'hidden', textOverflow:'ellipsis', maxWidth:'180px'}}>
                    {currentUser.email}
                  </small>
                </div>

                <ul>
                  <li onClick={() => handleNavigate('/profile')}>
                    <FaUser className="icon" /> My Profile
                  </li>
                  
                  <li onClick={() => handleNavigate('/dashboard')}>
                    <FaBoxOpen className="icon" /> My Orders
                  </li>

                  <li onClick={() => handleNavigate('/wishlist')}>
                     <FaHeart className="icon" style={{color: '#ef4444'}}/> My Wishlist
                  </li>

                  <li onClick={() => handleNavigate('/track-order')}>
                    <FaSearchLocation className="icon" /> Track Order
                  </li>

                  {(userRole === 'admin' || userRole === 'staff') && (
                    <li onClick={() => handleNavigate('/admin')} style={{ borderTop: '1px solid #f3f4f6', background: '#f0f9ff', color: '#0284c7' }}>
                      <FaChartLine className="icon" style={{ color: '#0284c7'}}/> Admin Panel
                    </li>
                  )}

                  <li className="divider"></li>

                  <li onClick={() => handleNavigate('/settings')}>
                    <FaCog className="icon" /> Settings
                  </li>

                  <li className="divider"></li>

                  <li onClick={handleLogout} className="logout-item">
                    <FaSignOutAlt className="icon" /> Logout
                  </li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="login-link">
            Login
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;