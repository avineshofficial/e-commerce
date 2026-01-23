import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';
import '../styles/Form.css';

const Login = () => {
  const { googleSignIn } = useAuth();
  const navigate = useNavigate();

  const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL;

  const handleGoogleLogin = async () => {
    try {
      const user = await googleSignIn();
      console.log("Logged In:", user.email);

      // Check Email (Case Insensitive)
      if (user.email.toLowerCase().trim() === ADMIN_EMAIL?.toLowerCase().trim()) {
        navigate('/admin');
      } else {
        navigate('/'); // Redirect regular users to Home
      }
    } catch (error) {
      alert("Sign in failed. Please try again.");
    }
  };

  return (
    <div style={styles.pageContainer}>
      
      {/* Decorative Background Blob */}
      <div style={styles.bgBlob}></div>

      <div className="form-container" style={styles.loginCard}>
        
        {/* Brand Section */}
        <div style={styles.brandSection}>
          <div style={styles.logoCircle}>
            <span style={styles.logoText}>NK</span>
          </div>
          <h1 style={styles.appTitle}>NK Enterprises</h1>
          <p style={styles.subtitle}>Secure Access Portal</p>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#f1f5f9', margin: '20px 0', width: '100%' }}></div>

        {/* Login Action */}
        <div style={{ width: '100%' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#1f2937' }}>Welcome Back</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '30px' }}>
            Access your orders, wishlist, and account settings.
          </p>

          <button 
            onClick={handleGoogleLogin}
            className="btn"
            style={styles.googleBtn}
          >
            <div style={styles.googleIconBg}><FaGoogle /></div>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Footer */}
        <div style={styles.footerLinks}>
          <Link to="/" style={{ textDecoration: 'none', color: '#64748b', fontSize: '0.85rem' }}>
            ← Back to Store
          </Link>
          <span style={{ margin: '0 8px', color: '#ccc' }}>|</span>
          <Link to="/help" style={{ textDecoration: 'none', color: '#64748b', fontSize: '0.85rem' }}>
            Need Help?
          </Link>
        </div>

      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    minHeight: '85vh', // Takes up mostly full height excluding header/footer
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
    position: 'relative',
    overflow: 'hidden'
  },
  bgBlob: {
    position: 'absolute',
    top: '-50px',
    right: '-50px',
    width: '300px',
    height: '300px',
    background: 'rgba(79, 70, 229, 0.05)',
    borderRadius: '50%',
    zIndex: 0
  },
  loginCard: {
    maxWidth: '420px',
    width: '90%',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid #ffffff',
    borderRadius: '24px',
    boxShadow: '0 20px 40px -5px rgba(0, 0, 0, 0.1), 0 8px 16px -6px rgba(0, 0, 0, 0.1)',
    zIndex: 1
  },
  brandSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '10px'
  },
  logoCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'var(--primary-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '15px',
    boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)'
  },
  logoText: {
    color: 'white',
    fontSize: '1.5rem',
    fontWeight: '800',
    letterSpacing: '-1px'
  },
  appTitle: {
    margin: '0',
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e1b4b'
  },
  subtitle: {
    margin: '5px 0 0 0',
    color: '#6b7280',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  googleBtn: {
    width: '100%',
    background: 'white',
    color: '#334155',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    padding: '14px',
    fontSize: '1rem',
    transition: 'all 0.2s',
    marginBottom: '20px'
  },
  googleIconBg: {
    color: '#ea4335',
    fontSize: '1.2rem',
    display: 'flex'
  },
  footerLinks: {
    marginTop: 'auto',
    borderTop: '1px solid #f8fafc',
    paddingTop: '20px',
    width: '100%',
    textAlign: 'center'
  }
};

export default Login;