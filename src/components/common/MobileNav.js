import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaHeart, FaShoppingCart, FaUser } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import '../../styles/MobileNav.css';

const MobileNav = () => {
  const { cartItems } = useCart();

  const cartCount = cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <nav className="mobile-nav">
      
      {/* Home Link */}
      <NavLink 
        to="/" 
        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
      >
        <FaHome />
        <span>Home</span>
      </NavLink>

      {/* Wishlist Link */}
      <NavLink 
        to="/wishlist" 
        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
      >
        <FaHeart />
        <span>Wishlist</span>
      </NavLink>

      {/* Cart Link with Badge */}
      <NavLink 
        to="/cart" 
        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
      >
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <FaShoppingCart />
          {cartCount > 0 && <span className="mobile-badge">{cartCount}</span>}
        </div>
        <span>Cart</span>
      </NavLink>

      {/* Profile/Dashboard Link */}
      <NavLink 
        to="/dashboard" 
        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
      >
        <FaUser />
        <span>Account</span>
      </NavLink>

    </nav>
  );
};

export default MobileNav;