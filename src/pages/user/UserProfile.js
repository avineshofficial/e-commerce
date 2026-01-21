import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import AddressManager from './AddressManager'; // <--- IMPORT THIS
import { FaUser, FaSave, FaAddressBook } from 'react-icons/fa';
import '../../styles/Form.css';

const UserProfile = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('info'); // 'info' or 'address'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    phone: ''
  });

  // Fetch only basic Profile Data
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const docRef = doc(db, "users_collection", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            // Only pull display info, address is now handled separately
            const { displayName, email } = docSnap.data();
            setProfileData({ displayName: displayName || '', email: email || '' });
          }
        } catch (error) { console.error(error); }
      }
      setLoading(false);
    };
    fetchUserData();
  }, [currentUser]);

  // Save Personal Info
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "users_collection", currentUser.uid), {
        ...profileData,
        phone_number: currentUser.phoneNumber,
        uid: currentUser.uid
      }, { merge: true }); // Merge ensures we don't delete sub-collections
      alert("Personal details updated.");
    } catch (err) { alert("Failed to update."); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading-container">Loading Profile...</div>;

  return (
    <div className="form-container" style={{ maxWidth: '700px' }}>
      <div className="form-header">
        <h2 style={{ margin: 0 }}>My Account</h2>
      </div>

      {/* TABS HEADER */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '25px' }}>
        <button 
          onClick={() => setActiveTab('info')}
          style={{
            flex: 1, padding: '12px', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'info' ? '3px solid var(--primary-color)' : '3px solid transparent',
            color: activeTab === 'info' ? 'var(--primary-color)' : '#6b7280', fontWeight: 'bold'
          }}>
          <FaUser style={{ marginRight: '8px' }} /> Personal Info
        </button>
        <button 
          onClick={() => setActiveTab('address')}
          style={{
            flex: 1, padding: '12px', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'address' ? '3px solid var(--primary-color)' : '3px solid transparent',
            color: activeTab === 'address' ? 'var(--primary-color)' : '#6b7280', fontWeight: 'bold'
          }}>
          <FaAddressBook style={{ marginRight: '8px' }} /> Address Book
        </button>
      </div>

      {/* TAB CONTENT 1: PERSONAL INFO FORM */}
      {activeTab === 'info' && (
        <form onSubmit={handleSaveInfo}>
          <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f9ff', borderRadius: '8px', color: '#0369a1' }}>
            <strong>Account:</strong> {currentUser?.phoneNumber}
          </div>
          
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" className="form-input" value={profileData.displayName}
              onChange={(e) => setProfileData({...profileData, displayName: e.target.value})} 
              placeholder="Enter your name"
            />
          </div>

          <div className="form-group">
            <label>Email ID</label>
            <input 
              type="email" className="form-input" value={profileData.email}
              onChange={(e) => setProfileData({...profileData, email: e.target.value})} 
              placeholder="Enter your email"
            />
          </div>

          <button className="btn" type="submit" disabled={saving} style={{ width: '100%' }}>
            {saving ? 'Saving...' : <><FaSave /> Update Details</>}
          </button>
        </form>
      )}

      {/* TAB CONTENT 2: ADDRESS MANAGER */}
      {activeTab === 'address' && (
        <AddressManager />
      )}
      
    </div>
  );
};

export default UserProfile;