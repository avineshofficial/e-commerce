import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaChartLine, FaPlus, FaBox, FaBoxOpen, FaHome, FaUsers, FaTicketAlt, FaImages, FaFileCsv, FaEnvelope, FaCommentDots, FaBars, FaTimes, FaUserShield } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { FaCalculator } from 'react-icons/fa';
import '../../styles/Admin.css'; 

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { userRole } = useAuth(); // Get dynamic role

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const navStyle = {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 15px', borderRadius: '8px',
    color: '#64748b', textDecoration: 'none', marginBottom: '5px',
    fontWeight: '500', transition: 'all 0.2s ease', fontSize: '0.95rem'
  };

  const activeStyle = {
    ...navStyle,
    background: '#eff6ff', color: '#4f46e5',
    fontWeight: '600', borderLeft: '4px solid #4f46e5'
  };

  // Capitalize Role
  const displayRole = userRole 
    ? userRole.charAt(0).toUpperCase() + userRole.slice(1) 
    : 'Admin';

  return (
    <>
      {/* Mobile Floating Toggle Button */}
      <button className="mobile-admin-toggle" onClick={toggleSidebar}>
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Dark Overlay */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`} 
        onClick={closeSidebar}
      ></div>

      {/* Sidebar Content */}
      <div className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        
        {/* FIXED: Header showing Role correctly */}
        <div className="sidebar-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, color: '#1f2937', fontSize:'1.3rem' }}>Admin Panel</h3>
            <span style={{ 
              fontSize: '0.8rem', color: '#6b7280', 
              background: '#f1f5f9', padding:'2px 8px', borderRadius:'4px',
              fontWeight: '600', display:'inline-block', marginTop:'5px' 
            }}>
              Role: <span style={{ color: 'var(--primary-color)' }}>{displayRole}</span>
            </span>
          </div>
          {/* Close Button inside Sidebar */}
          <button 
            onClick={closeSidebar}
            style={{ 
              background:'none', border:'none', fontSize:'1.2rem', color:'#9ca3af', 
              cursor:'pointer', padding:'5px', display: window.innerWidth <= 900 ? 'block' : 'none' 
            }}
          >
            <FaTimes />
          </button>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', paddingBottom:'20px' }}>
          
          <NavLink to="/admin" end style={({ isActive }) => isActive ? activeStyle : navStyle} onClick={closeSidebar}>
            <FaChartLine /> Dashboard
          </NavLink>

          {/* Group 1: Products */}
          <div style={{ margin: '20px 0 5px 0', fontSize: '0.75rem', fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase', paddingLeft: '10px' }}>
            Products
          </div>

          <NavLink to="/admin/add-product" style={({ isActive }) => isActive ? activeStyle : navStyle} onClick={closeSidebar}>
            <FaPlus /> Add Product
          </NavLink>
          
          <NavLink to="/admin/inventory" style={({ isActive }) => isActive ? activeStyle : navStyle} onClick={closeSidebar}>
            <FaBox /> Inventory
          </NavLink>

          <NavLink to="/admin/categories" style={({ isActive }) => isActive ? activeStyle : navStyle} onClick={closeSidebar}>
            <FaBox /> Categories
          </NavLink>

          {/* Group 2: Orders & Users */}
          <div style={{ margin: '20px 0 5px 0', fontSize: '0.75rem', fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase', paddingLeft: '10px' }}>
            Operations
          </div>

          <NavLink to="/admin/orders" style={({ isActive }) => isActive ? activeStyle : navStyle} onClick={closeSidebar}>
            <FaBoxOpen /> Orders
          </NavLink>

          <NavLink to="/admin/users" style={({ isActive }) => isActive ? activeStyle : navStyle} onClick={closeSidebar}>
            <FaUsers /> Customers
          </NavLink>

          <NavLink to="/admin/coupons" style={({ isActive }) => isActive ? activeStyle : navStyle} onClick={closeSidebar}>
            <FaTicketAlt /> Coupons
          </NavLink>

          {/* Group 3: Support */}
          <div style={{ margin: '20px 0 5px 0', fontSize: '0.75rem', fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase', paddingLeft: '10px' }}>
            Support
          </div>

          <NavLink to="/admin/messages" style={({ isActive }) => isActive ? activeStyle : navStyle} onClick={closeSidebar}>
            <FaEnvelope /> Inquiries
          </NavLink>

          <NavLink to="/admin/reviews" style={({ isActive }) => isActive ? activeStyle : navStyle} onClick={closeSidebar}>
            <FaCommentDots /> Reviews
          </NavLink>

          {/* Group 4: Config (Admin Only Features) */}
          <div style={{ margin: '20px 0 5px 0', fontSize: '0.75rem', fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase', paddingLeft: '10px' }}>
            Config
          </div>

          <NavLink to="/admin/sliders" style={({ isActive }) => isActive ? activeStyle : navStyle} onClick={closeSidebar}>
            <FaImages /> Home Banners
          </NavLink>

          <NavLink to="/admin/billing" style={({ isActive }) => isActive ? activeStyle : navStyle} onClick={closeSidebar}>
            <FaCalculator /> POS / Billing
          </NavLink>

          {userRole === 'admin' && (
            <>
              <NavLink to="/admin/reports" style={({ isActive }) => isActive ? activeStyle : navStyle} onClick={closeSidebar}>
                <FaFileCsv /> Data Reports
              </NavLink>
              
              <NavLink to="/admin/team" style={({ isActive }) => isActive ? activeStyle : navStyle} onClick={closeSidebar}>
                <FaUserShield /> Team Access
              </NavLink>
            </>
          )}

          <div style={{ borderTop: '1px solid #f1f5f9', margin: '15px 0' }}></div>

          <NavLink to="/" style={navStyle} onClick={closeSidebar}>
             <FaHome /> Visit Website
          </NavLink>
        </nav>
      </div>
    </>
  );
};

export default AdminSidebar;