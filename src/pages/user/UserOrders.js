import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore'; 
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';
import { FaBoxOpen, FaShoppingBag, FaClock, FaCheckCircle, FaTruck, FaMapMarkerAlt, FaTag, FaChevronDown, FaChevronUp, FaInfoCircle, FaPhone, FaEnvelope, FaTimesCircle } from 'react-icons/fa';
import { sendOrderEmail } from '../../utils/emailService';
import '../../styles/Orders.css';

const UserOrders = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (currentUser) {
        try {
          // Identify user (supports UID matching as best practice)
          const q = query(collection(db, "orders_collection"), where("user_id", "==", currentUser.uid));
          const snap = await getDocs(q);
          const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          data.sort((a, b) => b.date - a.date);
          setOrders(data);
        } catch (error) { console.error(error); }
      }
      setLoading(false);
    };
    fetchOrders();
  }, [currentUser]);

  const toggleDetails = (id) => setExpandedId(expandedId === id ? null : id);

  const handleCancelOrder = async (order) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
        await updateDoc(doc(db, "orders_collection", order.id), { status: 'Cancelled' });

        order.items.forEach(async (item) => {
            if (item.realId || item.id) {
                const prodRef = doc(db, "products_collection", item.realId || item.id);
                try {
                    await updateDoc(prodRef, {
                        stock_quantity: increment(item.quantity),
                        sold_count: increment(-item.quantity)
                    });
                } catch(err) { console.error("Restock failed", err); }
            }
        });

        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Cancelled' } : o));
        toast.error("Order Cancelled Successfully.");
        sendOrderEmail(order, 'Cancelled'); 

    } catch (error) {
        console.error(error);
        toast.error("Failed to cancel order.");
    }
  };

  const getStatusInfo = (status) => {
    switch(status) {
      case 'Delivered': return { class: 'status-delivered', icon: <FaCheckCircle />, color: '#10b981', label: 'Delivered' };
      case 'Shipped': return { class: 'status-shipped', icon: <FaTruck />, color: '#3b82f6', label: 'Shipped' };
      case 'Cancelled': return { class: 'status-cancelled', icon: <FaTimesCircle />, color: '#ef4444', label: 'Cancelled' };
      default: return { class: 'status-pending', icon: <FaClock />, color: '#f59e0b', label: 'Pending' };
    }
  };

  if (loading) return <div style={{padding:'50px', textAlign:'center'}}>Loading...</div>;

  return (
    <div className="container orders-container">
      <div className="dashboard-header">
        <div>
           <h2>My Orders</h2>
           <p style={{ color: 'var(--text-light)', margin: '5px 0 0 0' }}>{currentUser?.email}</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <FaShoppingBag size={50} style={{ color: '#e2e8f0', marginBottom: '20px' }} />
          <h3>No Orders Found</h3>
          <Link to="/" className="btn">Shop Now</Link>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'15px' }}>
          {orders.map(order => {
            const status = getStatusInfo(order.status);
            const isExpanded = expandedId === order.id;
            const displayPhone = order.user_phone || order.shipping_details?.phoneNumber || "N/A";
            
            // Calculate numeric values for display
            const subtotal = order.subtotal || order.total_amount; 
            const shipping = order.shipping_cost || 0;
            // Simple logic to find discount amount if not explicitly stored
            const discountAmt = order.discount_details?.percent 
                ? Math.round((subtotal * order.discount_details.percent) / 100) 
                : 0;

            return (
              <div key={order.id} style={{ background: 'white', borderRadius: '12px', border: isExpanded ? '1px solid var(--primary-color)' : '1px solid #f3f4f6', overflow: 'hidden' }}>
                
                {/* Header */}
                <div onClick={() => toggleDetails(order.id)} style={{ padding: '15px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isExpanded ? '#f8fafc' : 'white' }}>
                   <div>
                     <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>#{order.id.slice(0, 8)}</span>
                     <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{order.date ? new Date(order.date.seconds * 1000).toDateString() : 'N/A'}</div>
                   </div>
                   <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ fontWeight:'700', fontSize:'1rem' }}>₹{order.total_amount}</span>
                      <span style={{ color: status.color, background: `${status.color}15`, padding:'4px 10px', borderRadius:'15px', fontSize:'0.75rem', fontWeight:'bold', display:'flex', alignItems:'center', gap:'4px' }}>
                        {status.icon} {order.status}
                      </span>
                      {isExpanded ? <FaChevronUp color="#ccc"/> : <FaChevronDown color="#ccc"/>}
                   </div>
                </div>

                {/* Details */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #e2e8f0', padding: '20px', animation: 'slideDown 0.3s ease' }}>
                    
                    {/* ITEMS SECTION */}
                    <h4 style={{ margin: '0 0 15px 0', fontSize:'0.85rem', color:'#9ca3af' }}>ITEMS</h4>
                    <div style={{ background: '#f9fafb', borderRadius:'8px', padding:'15px', marginBottom:'20px' }}>
                        {order.items?.map((item, idx) => (
                          <div key={idx} style={{ 
                            display: 'flex', gap: '12px', marginBottom: '12px', 
                            paddingBottom: idx !== order.items.length-1 ? '12px' : '0',
                            borderBottom: idx !== order.items.length-1 ? '1px dashed #e5e7eb' : 'none',
                            alignItems: 'center'
                          }}>
                             <img 
                               src={item.image_url || 'https://via.placeholder.com/60'} alt={item.name} 
                               style={{ width:'50px', height:'50px', objectFit:'cover', borderRadius:'6px', border:'1px solid #e5e7eb', background:'white' }}
                             />
                             <div style={{ flex: 1 }}>
                                <div style={{ fontSize:'0.95rem', fontWeight:'600', color:'#1f2937' }}>{item.name}</div>
                                <div style={{ fontSize:'0.85rem', color:'#6b7280' }}>
                                  Qty: {item.quantity} {item.unit && <span style={{marginLeft:'5px', background:'#e2e8f0', padding:'2px 5px', borderRadius:'4px', fontSize:'0.75rem'}}>{item.unit}</span>}
                                </div>
                             </div>
                             <span style={{ fontWeight:'700', fontSize:'0.95rem' }}>₹{item.price * item.quantity}</span>
                          </div>
                        ))}

                        {/* FINANCIAL BREAKDOWN */}
                        <div style={{ marginTop:'15px', paddingTop:'15px', borderTop:'1px solid #cbd5e1' }}>
                            {/* Subtotal */}
                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.9rem', color:'#64748b', marginBottom:'5px' }}>
                                <span>Subtotal</span>
                                <span>₹{subtotal}</span>
                            </div>

                            {/* Shipping */}
                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.9rem', color:'#64748b', marginBottom:'5px' }}>
                                <span>Shipping</span>
                                <span style={{ color: shipping === 0 ? '#16a34a' : '#64748b' }}>
                                  {shipping === 0 ? 'Free' : `+ ₹${shipping}`}
                                </span>
                            </div>

                            {/* Discount */}
                            {order.discount_details?.code && (
                                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.9rem', color:'#16a34a', marginBottom:'5px' }}>
                                    <span style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                                      <FaTag size={10} /> Coupon ({order.discount_details.code})
                                    </span>
                                    <span>- ₹{discountAmt}</span>
                                </div>
                            )}

                            {/* Grand Total */}
                            <div style={{ display:'flex', justifyContent:'space-between', marginTop:'10px', paddingTop:'10px', borderTop:'1px solid #e2e8f0', fontSize:'1.1rem', fontWeight:'800', color:'#1f2937' }}>
                                <span>Total Paid</span>
                                <span>₹{order.total_amount}</span>
                            </div>
                        </div>
                    </div>

                    {/* ADDRESS SECTION */}
                    <div style={{ border:'1px solid #e2e8f0', borderRadius:'8px', padding:'15px', marginBottom: '20px' }}>
                       <h4 style={{ margin: '0 0 10px 0', fontSize:'0.85rem', color:'#9ca3af' }}>SHIPPING DETAILS</h4>
                       <div style={{fontWeight:'bold', fontSize:'1rem', color:'#334155', marginBottom:'5px'}}>
                          {order.shipping_details?.fullName}
                       </div>
                       
                       <div style={{fontSize:'0.9rem', color:'#4b5563', lineHeight:'1.5', marginBottom:'10px'}}>
                          {order.shipping_details?.houseNo}, {order.shipping_details?.roadName} <br/>
                          {order.shipping_details?.city}, {order.shipping_details?.state} - <strong>{order.shipping_details?.pincode}</strong>
                       </div>

                       <div style={{ display:'flex', flexDirection:'column', gap:'5px', fontSize:'0.9rem', color:'#4b5563', borderTop:'1px solid #f1f5f9', paddingTop:'10px' }}>
                          <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                             <FaPhone size={12} color="#94a3b8"/> {displayPhone}
                          </div>
                          <div style={{display:'flex', alignItems:'center', gap:'8px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%'}}>
                             <FaEnvelope size={12} color="#94a3b8"/> {order.user_email || currentUser.email}
                          </div>
                       </div>
                    </div>

                    {/* FOOTER ACTIONS */}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'15px' }}>
                        <div style={{ padding:'12px', background:'#f0f9ff', borderRadius:'6px', fontSize:'0.8rem', color:'#0369a1', display:'flex', alignItems:'center', gap:'8px', flexGrow: 1, minWidth: '200px' }}>
                           <FaInfoCircle size={14} style={{flexShrink:0}}/> 
                           <span>Queries? Email: <b>support@nkenterprises.com</b></span>
                        </div>

                        {order.status === 'Pending' && (
                            <button 
                                onClick={() => handleCancelOrder(order)}
                                className="btn"
                                style={{ 
                                  background:'#fee2e2', color:'#ef4444', border:'1px solid #fca5a5', 
                                  padding:'12px 15px', fontSize:'0.9rem', flexGrow: 1, whiteSpace:'nowrap',
                                  display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' 
                                }}
                            >
                                <FaTimesCircle /> Cancel Order
                            </button>
                        )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes slideDown { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default UserOrders;