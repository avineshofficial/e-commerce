import React, { useState } from 'react';
import { db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FaSearch, FaBoxOpen, FaCheck, FaTruck, FaClock, FaTimesCircle } from 'react-icons/fa';
import '../../styles/TrackOrder.css';

const TrackOrder = () => {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const docRef = doc(db, "orders_collection", orderId.trim());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() });
      } else {
        setError("Order ID not found. Please check and try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to track order. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Logic to determine active step
  const getProgressLevel = (status) => {
    if (status === 'Delivered') return 3;
    if (status === 'Shipped') return 2;
    if (status === 'Cancelled') return -1; // Special State
    return 1; // Pending/Processing
  };

  const currentLevel = order ? getProgressLevel(order.status) : 0;
  const isCancelled = currentLevel === -1;

  return (
    <div className="container track-container">
      
      <div className="track-card">
        <div className="track-header">
          <FaBoxOpen size={50} style={{ color: '#e0e7ff', marginBottom:'15px' }}/>
          <h1>Track Your Order</h1>
          <p>Enter your Order ID to see live updates.</p>
        </div>

        <form onSubmit={handleTrack}>
          <div className="track-input-group">
            <FaSearch className="input-icon" />
            <input 
              type="text" 
              className="track-input"
              placeholder="e.g. A7B2X9Z"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn" 
            style={{ width: '100%', justifyContent: 'center', padding: '15px', fontSize: '1.1rem' }}
            disabled={loading || !orderId}
          >
            {loading ? 'Searching...' : 'Track Package'}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: '20px', padding: '15px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* --- TRACKING RESULT --- */}
        {order && (
          <div className="track-result">
            <div className="result-header">
              <div>
                <strong style={{ fontSize: '1.2rem', color:'#1e293b' }}>Current Status:</strong>
              </div>
              {/* Dynamic Badge Class */}
              <div className={`status-badge-lg status-${order.status?.toLowerCase() || 'pending'}`}>
                {order.status || 'Processing'}
              </div>
            </div>

            <p style={{ color:'#64748b', fontSize: '0.9rem', marginBottom:'30px' }}>
              <strong>Ordered:</strong> {order.date ? new Date(order.date.seconds * 1000).toLocaleDateString() : 'N/A'} <br/>
              <strong>Receiver:</strong> {order.shipping_details?.fullName} <br/>
              <strong>Total:</strong> ₹{order.total_amount}
            </p>

            {/* --- PROGRESS TIMELINE --- */}
            <div className="track-progress">
              
              {/* If Cancelled, red bar fills up partially or looks stopped. Using solid red here. */}
              <div 
                className={`track-bar-fill ${isCancelled ? 'cancelled-bar' : ''}`} 
                style={{ 
                  width: isCancelled ? '33%' : (currentLevel === 3 ? '100%' : currentLevel === 2 ? '50%' : '0%') 
                }}
              ></div>

              {/* Step 1: Placed (Always Done) */}
              <div className="progress-step completed">
                <div className="step-circle" style={{ borderColor: isCancelled ? '#ef4444' : '#10b981', background: isCancelled ? '#ef4444' : '#10b981', color: 'white' }}>
                  <FaCheck />
                </div>
                <div className="step-label">Order Placed</div>
              </div>

              {/* Step 2: Shipping OR Cancelled */}
              {isCancelled ? (
                // --- CANCELLED VIEW ---
                <div className="progress-step cancelled-step">
                  <div className="step-circle">
                    <FaTimesCircle size={18} />
                  </div>
                  <div className="step-label">Cancelled</div>
                </div>
              ) : (
                // --- NORMAL VIEW ---
                <div className={`progress-step ${currentLevel >= 2 ? 'completed' : ''}`}>
                  <div className="step-circle"><FaTruck /></div>
                  <div className="step-label">Shipped</div>
                </div>
              )}

              {/* Step 3: Delivered (Or Refunded placeholder) */}
              {isCancelled ? (
                // --- REFUND VIEW ---
                <div className="progress-step">
                  <div className="step-circle" style={{ borderColor: '#cbd5e1', color:'#cbd5e1' }}><FaCheck /></div>
                  <div className="step-label" style={{ color:'#94a3b8' }}>Refunded</div>
                </div>
              ) : (
                // --- NORMAL VIEW ---
                <div className={`progress-step ${currentLevel >= 3 ? 'completed' : ''}`}>
                  <div className="step-circle"><FaBoxOpen /></div>
                  <div className="step-label">Delivered</div>
                </div>
              )}

            </div>

            {/* Help Message */}
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', textAlign: 'center', color:'#64748b', fontSize: '0.85rem' }}>
              {isCancelled ? (
                <span style={{ color: '#dc2626' }}>
                  This order was cancelled. Any amount paid online will be refunded within 5-7 business days.
                </span>
              ) : (
                <span>Need help? <span style={{ color: 'var(--primary-color)', cursor:'pointer' }}>Contact Support</span> with your Order ID.</span>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TrackOrder;