import React from 'react';
import { Link } from 'react-router-dom';
import { FaGhost, FaHome } from 'react-icons/fa';

const NotFound = () => {
  return (
    <div className="container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '60vh', 
      textAlign: 'center',
      padding: '20px'
    }}>
      <FaGhost size={80} style={{ color: '#cbd5e1', marginBottom: '20px' }} />
      <h1 style={{ fontSize: '3rem', margin: 0, color: 'var(--text-main)' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', marginTop: '10px', color: 'var(--text-light)' }}>Page Not Found</h2>
      
      <p style={{ maxWidth: '400px', margin: '20px auto', color: '#6b7280', lineHeight: '1.6' }}>
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>

      <Link to="/" className="btn" style={{ padding: '12px 30px', fontSize: '1rem' }}>
        <FaHome /> Go Back Home
      </Link>
    </div>
  );
};

export default NotFound;