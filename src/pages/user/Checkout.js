import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, setDoc, getDocs, serverTimestamp, doc, runTransaction, query, where } from 'firebase/firestore'; // Added runTransaction
import { useNavigate, Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaCheckCircle, FaLock, FaTag, FaTimes, FaSpinner, FaPhone } from 'react-icons/fa';
import { sendOrderEmail } from '../../utils/emailService'; 
import '../../styles/Checkout.css';

const Checkout = () => {
  const { cartItems, clearCart, cartSubtotal, shippingCost } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [discountData, setDiscountData] = useState({ code: null, percent: 0 });
  const [couponMsg, setCouponMsg] = useState({ type: '', text: '' });

  // Calculation Logic
  const discountAmount = Math.round((cartSubtotal * discountData.percent) / 100);
  const finalTotal = (cartSubtotal - discountAmount) + shippingCost;

  // 1. Fetch User Addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!currentUser) return;
      try {
        const querySnapshot = await getDocs(collection(db, `users_collection/${currentUser.uid}/addresses`));
        const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSavedAddresses(list);
        if (list.length > 0) setSelectedAddressId(list[0].id);
      } catch (error) { console.error(error); }
    };
    fetchAddresses();
  }, [currentUser]);

  // --- COUPON VALIDATION ---
  const handleApplyCoupon = async () => {
    setCouponMsg({ type: '', text: '' });
    if (!couponCode.trim()) return;

    setCheckingCoupon(true);
    try {
      const q = query(
        collection(db, "coupons"), 
        where("code", "==", couponCode.trim().toUpperCase()),
        where("isActive", "==", true)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        const coupon = snap.docs[0].data();
        setDiscountData({ code: coupon.code, percent: Number(coupon.discount) });
        const previewDisc = Math.round((cartSubtotal * Number(coupon.discount)) / 100);
        setCouponMsg({ type: 'success', text: `Applied! Saving ₹${previewDisc}` });
      } else {
        setDiscountData({ code: null, percent: 0 });
        setCouponMsg({ type: 'error', text: 'Invalid or Expired Code' });
      }
    } catch (error) {
      setCouponMsg({ type: 'error', text: 'Check Failed' });
    } finally {
      setCheckingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setDiscountData({ code: null, percent: 0 });
    setCouponCode('');
    setCouponMsg({ type: '', text: '' });
  };

  const generateReadableId = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 7; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  };

  // --- PLACE ORDER LOGIC (Updated Stock Reduction) ---
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return alert("Cart is empty");
    if (!selectedAddressId && savedAddresses.length > 0) return alert("Please select a delivery address.");
    if (savedAddresses.length === 0) {
      alert("Please add a shipping address first.");
      navigate('/profile');
      return;
    }

    setLoading(true);

    try {
      const addressData = savedAddresses.find(addr => addr.id === selectedAddressId);
      const userEmail = currentUser.email || ""; 
      const contactPhone = addressData.phoneNumber || addressData.phone || currentUser.phoneNumber || 'N/A';
      
      const orderId = generateReadableId();

      const orderPayload = {
        id: orderId, 
        user_id: currentUser.uid,
        user_phone: contactPhone,
        user_email: userEmail,
        shipping_details: addressData,
        items: cartItems,
        subtotal: cartSubtotal,
        shipping_cost: shippingCost,
        discount_details: { 
            code: discountData.code,
            percent: discountData.percent,
            amount: discountAmount 
        },
        total_amount: finalTotal,       
        status: 'Pending',
        payment_mode: 'COD',
        date: serverTimestamp()
      };

      // 1. Create Order
      await setDoc(doc(db, "orders_collection", orderId), orderPayload);

      // 2. STOCK REDUCTION LOGIC (TRANSACTION)
      // This is crucial for products with Variants (e.g. 1kg, 500g)
      // We must loop through each cart item and run a transaction
      for (const item of cartItems) {
        try {
            const productRef = doc(db, "products_collection", item.realId || item.id);
            
            await runTransaction(db, async (transaction) => {
                const sfDoc = await transaction.get(productRef);
                if (!sfDoc.exists()) return;

                const productData = sfDoc.data();
                
                // Case A: Product has VARIANTS (e.g., 1kg, 500g)
                if (productData.variants && productData.variants.length > 0 && item.unit) {
                    
                    // Create updated variants array with reduced stock
                    const updatedVariants = productData.variants.map((v) => {
                        // Check if unit matches
                        if (v.unit === item.unit) {
                           // reduce specific stock
                           const newStock = Math.max(0, Number(v.stock) - item.quantity);
                           return { ...v, stock: newStock };
                        }
                        return v;
                    });

                    // Update global total stock too
                    const newTotalStock = updatedVariants.reduce((sum, v) => sum + Number(v.stock), 0);
                    const newSold = (productData.sold_count || 0) + item.quantity;

                    transaction.update(productRef, { 
                        variants: updatedVariants,
                        stock_quantity: newTotalStock,
                        sold_count: newSold
                    });
                } 
                // Case B: Simple Product (No variants)
                else {
                    const newStock = Math.max(0, (productData.stock_quantity || 0) - item.quantity);
                    const newSold = (productData.sold_count || 0) + item.quantity;

                    transaction.update(productRef, { 
                        stock_quantity: newStock,
                        sold_count: newSold
                    });
                }
            });

        } catch (err) {
            console.error("Stock transaction failed for", item.name, err);
        }
      }

      // 3. Email & Cleanup
      sendOrderEmail(orderPayload, 'Processing');
      clearCart();
      navigate('/order-success', { state: { orderId: orderId } });
      
    } catch (error) {
      console.error(error);
      alert("Order Placement Failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <h2 style={{ marginBottom: '30px' }}>Secure Checkout</h2>
      
      <div className="checkout-container">
        
        {/* Left Column (Address Selection) */}
        <div>
          <div className="checkout-section">
            <div className="checkout-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaMapMarkerAlt /> Delivery Address
              </h3>
              <Link to="/profile" style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>+ Add New</Link>
            </div>

            {savedAddresses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{marginBottom: '15px'}}>No addresses found.</p>
                <Link to="/profile" className="btn">Add Address</Link>
              </div>
            ) : (
              <div className="address-grid">
                {savedAddresses.map((addr) => (
                  <div key={addr.id} 
                    className={`address-card ${selectedAddressId === addr.id ? 'selected' : ''}`}
                    onClick={() => setSelectedAddressId(addr.id)}
                  >
                    <div className="address-check-icon"><FaCheckCircle /></div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <strong>{addr.fullName}</strong> 
                      <span style={{fontSize:'0.8rem', background:'#f1f5f9', padding:'2px 6px', borderRadius:'4px'}}>{addr.label}</span>
                    </div>
                    
                    <div style={{color:'#666', marginTop:'5px', fontSize:'0.9rem', lineHeight:'1.4'}}>
                        {addr.houseNo}, {addr.roadName} <br/>
                        {addr.city}, {addr.state} - {addr.pincode}
                    </div>

                    <div style={{marginTop:'8px', fontSize:'0.85rem', display:'flex', gap:'6px', alignItems:'center', color:'#334155'}}>
                       <FaPhone size={10} color="#94a3b8"/> {addr.phoneNumber || addr.phone || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="checkout-section">
            <h3 style={{ margin: '0 0 10px 0', fontSize:'1.1rem' }}><FaLock /> Payment</h3>
            <div style={{ padding: '15px', background: '#eff6ff', borderRadius: '8px', border:'1px solid #bfdbfe' }}>
              <strong>Cash on Delivery (COD)</strong>
            </div>
          </div>
        </div>

        {/* Right Column (Summary & Coupon) */}
        <div className="checkout-summary">
          <h3 style={{ marginTop: 0 }}>Order Summary</h3>
          <div className="item-mini-list">
            {cartItems.map(item => (
              <div key={item.id} className="item-mini" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom:'12px' }}>
                <div style={{width:'50px', height:'50px', borderRadius:'4px', overflow:'hidden', border:'1px solid #eee'}}>
                   <img src={item.image_url || 'https://via.placeholder.com/50'} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                </div>
                <div style={{ flex: 1 }}>
                   <div style={{ fontWeight:'600', fontSize:'0.9rem', color:'#1e293b' }}>{item.name}</div>
                   <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Qty: {item.quantity} {item.unit ? `(${item.unit})` : ''}</div>
                </div>
                <strong>₹{item.price * item.quantity}</strong>
              </div>
            ))}
          </div>

          <div style={{ margin: '20px 0', padding: '15px', background: '#f8fafc', borderRadius: '8px', border:'1px dashed #cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom:'8px', color:'#475569', fontSize:'0.9rem' }}>
               <FaTag /> Have a Coupon?
            </div>
            
            {discountData.code ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#d1fae5', padding: '8px 12px', borderRadius: '4px', color:'#065f46', fontSize:'0.9rem' }}>
                <span>Code <strong>{discountData.code}</strong> applied!</span>
                <FaTimes style={{ cursor: 'pointer' }} onClick={removeCoupon}/>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  placeholder="ENTER CODE" 
                  style={{ flex:1, padding:'8px', borderRadius:'4px', border:'1px solid #cbd5e1', textTransform:'uppercase' }}
                  value={couponCode} onChange={(e) => setCouponCode(e.target.value)}
                />
                <button 
                  className="btn-outline" 
                  onClick={handleApplyCoupon} 
                  disabled={checkingCoupon || !couponCode}
                >
                  {checkingCoupon ? <FaSpinner className="fa-spin"/> : 'Apply'}
                </button>
              </div>
            )}
            
            {couponMsg.text && !discountData.code && (
               <div style={{ fontSize:'0.8rem', color: couponMsg.type === 'error' ? '#ef4444' : '#16a34a', marginTop:'8px', fontWeight:'500' }}>
                 {couponMsg.text}
               </div>
            )}
          </div>

          <div className="summary-row"><span>Subtotal</span><span>₹{cartSubtotal}</span></div>
          
          <div className="summary-row">
             <span>Shipping</span>
             <span style={{ color: shippingCost === 0 ? '#16a34a' : '#334155' }}>
               {shippingCost === 0 ? 'Free' : `+ ₹${shippingCost}`}
             </span>
          </div>
          
          {discountData.code && (
            <div className="summary-row" style={{ color: '#16a34a', fontWeight:'bold' }}>
              <span>Discount ({discountData.percent}%)</span>
              <span>- ₹{discountAmount}</span>
            </div>
          )}

          <div className="total-row" style={{borderTop:'1px dashed #e2e8f0', paddingTop:'15px', marginTop:'15px'}}>
            <span>Total Payable</span><span>₹{finalTotal}</span>
          </div>

          <button 
            className="btn" 
            onClick={handlePlaceOrder} 
            disabled={loading || savedAddresses.length === 0} 
            style={{ width: '100%', marginTop: '20px', padding: '15px' }}
          >
            {loading ? 'Processing...' : 'Place Order'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Checkout;