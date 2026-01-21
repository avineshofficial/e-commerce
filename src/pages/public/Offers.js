import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';
import { FaTag, FaCopy } from 'react-icons/fa';
import '../../styles/Offers.css';

const Offers = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        // Fetch only ACTIVE coupons
        const q = query(collection(db, "coupons"), where("isActive", "==", true));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCoupons(data);
      } catch (error) {
        console.error("Error fetching offers", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, []);

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon ${code} copied!`);
  };

  return (
    <div className="container offers-container">
      
      {/* Hero Header */}
      <div className="offers-header">
        <h1>Current Deals & Offers</h1>
        <p>Save big on your favorite products with our exclusive discount codes.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>Finding the best deals for you...</div>
      ) : coupons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '12px' }}>
          <h3>No active offers right now.</h3>
          <p style={{ color: '#666' }}>Please check back later or subscribe to our newsletter!</p>
        </div>
      ) : (
        <div className="coupon-grid">
          {coupons.map(coupon => (
            <div key={coupon.id} className="coupon-card">
              
              <div className="coupon-left">
                <div className="discount-val">{coupon.discount}%</div>
                <div className="discount-label">OFF</div>
              </div>

              <div className="coupon-right">
                <p className="coupon-desc">
                  {coupon.description || "Applicable on all products. Limited time offer."}
                </p>

                <div onClick={() => copyToClipboard(coupon.code)}>
                  <div className="code-box">
                    {coupon.code} <FaCopy style={{ fontSize: '0.8rem', marginLeft: '5px' }} />
                  </div>
                  <div className="copy-hint">Tap to Copy</div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Offers;