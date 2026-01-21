import React, { useState, useEffect } from 'react';
import { FaCog, FaBell, FaShieldAlt, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db } from '../../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import '../../styles/Settings.css';

const Settings = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Default Settings State
  // CHANGED: Default 'orderUpdates' is now FALSE (Off)
  const [settings, setSettings] = useState({
    orderUpdates: false, 
    marketingEmails: false,
  });

  // 1. Fetch Saved Settings
  useEffect(() => {
    const loadSettings = async () => {
        if(!currentUser) return;
        try {
            const docRef = doc(db, "users_collection", currentUser.uid);
            const docSnap = await getDoc(docRef);
            
            // If settings exist in DB, overwrite defaults
            if(docSnap.exists() && docSnap.data().settings) {
                setSettings(docSnap.data().settings);
            }
        } catch (e) { console.error("Load settings error", e); }
    };
    loadSettings();
  }, [currentUser]);

  // 2. Toggle Handler (Saves to DB)
  const handleToggle = async (key) => {
    const newValue = !settings[key];
    const newSettings = { ...settings, [key]: newValue };
    
    setSettings(newSettings); // UI update instant
    setLoading(true);

    try {
        const userRef = doc(db, "users_collection", currentUser.uid);
        await setDoc(userRef, { settings: newSettings }, { merge: true });
        
        // Custom message
        if (key === 'orderUpdates') {
             toast.success(`Notifications ${newValue ? 'Enabled' : 'Disabled'}`);
        } else {
             toast.success(`Preference Updated`);
        }

    } catch (error) {
        console.error(error);
        toast.error("Failed to save setting");
        setSettings(prev => ({...prev, [key]: !newValue})); // Revert on fail
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("CRITICAL WARNING: Permanently delete account? This cannot be undone.")) {
      try {
        await deleteUser(currentUser);
        toast.info("Account deleted.");
        navigate('/');
      } catch (error) {
        toast.error("Please login again to verify ownership before deletion.");
      }
    }
  };

  return (
    <div className="container settings-container" style={{ padding: '2rem 1rem' }}>
      <h2 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <FaCog color="#64748b" /> Account Settings
      </h2>

      {/* 1. Notifications Section */}
      <section className="settings-section">
        <div className="settings-header">
          <h3><FaBell /> Notifications</h3>
        </div>
        <div className="settings-body">
          
          <div className="setting-item">
            <div className="setting-info">
              <h4>Order Updates (Email)</h4>
              <p>
                Confirmations for Order placed, shipped & delivered. <br/>
                <strong>{currentUser?.email}</strong>
              </p>
            </div>
            {/* Toggle Switch */}
            <label className="switch">
              <input 
                type="checkbox" 
                checked={settings.orderUpdates} 
                disabled={loading}
                onChange={() => handleToggle('orderUpdates')} 
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Marketing & Offers</h4>
              <p>Receive exclusive deals and sales news.</p>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={settings.marketingEmails} 
                disabled={loading}
                onChange={() => handleToggle('marketingEmails')} 
              />
              <span className="slider"></span>
            </label>
          </div>
          
        </div>
      </section>

      {/* 2. Privacy & Security */}
      <section className="settings-section">
        <div className="settings-header">
          <h3><FaShieldAlt /> Privacy & Security</h3>
        </div>
        <div className="settings-body">
           <div className="setting-item">
             <div className="setting-info">
               <h4>Terms of Service</h4>
               <p>Review the rules and guidelines.</p>
             </div>
             <button className="btn secondary" onClick={() => navigate('/legal', { state: { tab: 'terms' } })}>
               View Terms
             </button>
           </div>
        </div>
      </section>

      {/* 3. Danger Zone */}
      <section className="settings-section danger-zone">
        <div className="settings-header">
          <h3><FaExclamationTriangle /> Danger Zone</h3>
        </div>
        <div className="settings-body">
           <div className="setting-item">
             <div className="setting-info">
               <h4 style={{ color: '#991b1b' }}>Delete Account</h4>
               <p>Permanently remove data.</p>
             </div>
             <button className="btn-danger" onClick={handleDeleteAccount}>
               <FaTrash style={{ marginRight: '8px' }}/> Delete Account
             </button>
           </div>
        </div>
      </section>
      
      <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem', marginTop: '10px' }}>
        NK Enterpriceses App v1.3.0
      </div>

    </div>
  );
};

export default Settings;