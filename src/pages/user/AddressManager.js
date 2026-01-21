import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaTrash, FaMapMarkerAlt, FaPhone, FaUser, FaBuilding, FaRoad } from 'react-icons/fa';

const AddressManager = () => {
  const { currentUser } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Expanded State for Detailed Address
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phoneNumber: '',
    pincode: '',
    houseNo: '',      // Flat, House no, Building, Company
    roadName: '',     // Area, Colony, Street, Sector
    landmark: '',
    city: '',
    state: '',
    label: 'Home'     // Home or Work
  });

  // Fetch Existing Addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!currentUser) return;
      try {
        const querySnapshot = await getDocs(collection(db, `users_collection/${currentUser.uid}/addresses`));
        setAddresses(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error loading addresses", error);
      }
    };
    fetchAddresses();
  }, [currentUser]);

  // Handle Form Inputs
  const handleChange = (e) => {
    setNewAddress({ ...newAddress, [e.target.name]: e.target.value });
  };

  // Handle Add Address (Save to Firestore)
  const handleAddAddress = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const docRef = await addDoc(collection(db, `users_collection/${currentUser.uid}/addresses`), newAddress);
      
      // Update UI immediately
      setAddresses([...addresses, { id: docRef.id, ...newAddress }]);
      
      // Reset Form
      setNewAddress({
        fullName: '', phoneNumber: '', pincode: '', 
        houseNo: '', roadName: '', landmark: '', 
        city: '', state: '', label: 'Home'
      });
      setShowForm(false);
      alert('Detailed address saved!');
    } catch (error) {
      console.error(error);
      alert("Error saving address");
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Address
  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to remove this address?")) return;
    try {
      await deleteDoc(doc(db, `users_collection/${currentUser.uid}/addresses`, id));
      setAddresses(addresses.filter(addr => addr.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1f2937' }}>Saved Addresses</h3>
        <button 
          className="btn" 
          onClick={() => setShowForm(!showForm)} 
          style={{ padding: '8px 15px', fontSize: '0.9rem' }}
        >
          {showForm ? 'Cancel' : <><FaPlus style={{ marginRight:'5px'}} /> Add New Address</>}
        </button>
      </div>

      {/* --- ADD NEW ADDRESS FORM --- */}
      {showForm && (
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #cbd5e1', animation: 'fadeIn 0.3s' }}>
          <h4 style={{ margin: '0 0 15px 0', color: 'var(--primary-color)' }}>Add New Address Details</h4>
          
          <form onSubmit={handleAddAddress}>
            {/* Section 1: Contact Details */}
            <div className="form-row">
              <div className="form-group">
                <label><FaUser size={12}/> Full Name (Receiver)</label>
                <input required type="text" name="fullName" className="form-input" 
                  placeholder="e.g. Rahul Sharma" value={newAddress.fullName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label><FaPhone size={12}/> Mobile Number</label>
                <input required type="text" name="phoneNumber" className="form-input" 
                  placeholder="10-digit number" value={newAddress.phoneNumber} onChange={handleChange} />
              </div>
            </div>

            {/* Section 2: Address Info */}
            <div className="form-row">
               <div className="form-group">
                <label>Pincode</label>
                <input required type="number" name="pincode" className="form-input" 
                  placeholder="6-digit pincode" value={newAddress.pincode} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>City</label>
                <input required type="text" name="city" className="form-input" 
                  placeholder="e.g. Mumbai" value={newAddress.city} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>State</label>
                <input required type="text" name="state" className="form-input" 
                  placeholder="e.g. Maharashtra" value={newAddress.state} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label><FaBuilding size={12}/> Flat, House no., Building, Company, Apartment</label>
              <input required type="text" name="houseNo" className="form-input" 
                placeholder="" value={newAddress.houseNo} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label><FaRoad size={12}/> Area, Colony, Street, Sector, Village</label>
              <input required type="text" name="roadName" className="form-input" 
                placeholder="" value={newAddress.roadName} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label><FaMapMarkerAlt size={12}/> Landmark (Optional)</label>
              <input type="text" name="landmark" className="form-input" 
                placeholder="E.g. Near Apollo Hospital" value={newAddress.landmark} onChange={handleChange} />
            </div>

            {/* Section 3: Label Type */}
            <div className="form-group">
              <label>Address Type</label>
              <div style={{ display: 'flex', gap: '20px', marginTop: '5px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal', cursor: 'pointer' }}>
                  <input type="radio" name="label" value="Home" 
                    checked={newAddress.label === 'Home'} onChange={handleChange} /> 
                  Home (All day delivery)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal', cursor: 'pointer' }}>
                  <input type="radio" name="label" value="Work" 
                    checked={newAddress.label === 'Work'} onChange={handleChange} /> 
                  Work (Delivery between 10 AM - 5 PM)
                </label>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn" style={{ width: '100%', marginTop: '10px', justifyContent:'center' }}>
              {loading ? 'Saving Details...' : 'Save & Use This Address'}
            </button>
          </form>
        </div>
      )}

      {/* --- LIST SAVED ADDRESSES --- */}
      <div style={{ display: 'grid', gap: '15px' }}>
        {addresses.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', padding: '30px', color: '#6b7280', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
            No saved addresses found. Please add one.
          </div>
        )}
        
        {addresses.map(addr => (
          <div key={addr.id} style={{ 
            border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', 
            position: 'relative', background: 'white', 
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)', transition: '0.2s' 
          }}>
            {/* Tag Badge */}
            <span style={{ 
              position: 'absolute', top: '20px', right: '50px', 
              background: '#f1f5f9', color: '#64748b', 
              fontSize: '0.75rem', fontWeight: 'bold', 
              padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase'
            }}>
              {addr.label}
            </span>

            {/* Content */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontWeight: '700', fontSize: '1rem', color: '#111827' }}>{addr.fullName}</span>
              <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#111827' }}>{addr.phoneNumber}</span>
            </div>

            <p style={{ margin: '0 0 5px 0', fontSize: '0.95rem', color: '#4b5563', lineHeight: '1.5' }}>
              {addr.houseNo}, {addr.roadName}
            </p>
            {addr.landmark && <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#6b7280' }}>Landmark: {addr.landmark}</p>}
            
            <p style={{ margin: 0, fontWeight: '500', color: '#374151' }}>
              {addr.city}, {addr.state} - <span style={{ fontWeight: '700' }}>{addr.pincode}</span>
            </p>

            {/* Delete Button */}
            <button 
              onClick={() => handleDelete(addr.id)}
              style={{ 
                position: 'absolute', top: '15px', right: '15px', 
                border: 'none', background: '#fee2e2', borderRadius: '50%',
                width: '30px', height: '30px',
                color: '#ef4444', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Delete Address"
            >
              <FaTrash size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddressManager;