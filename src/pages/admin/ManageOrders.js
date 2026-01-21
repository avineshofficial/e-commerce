import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, orderBy, query, updateDoc, doc } from 'firebase/firestore';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { FaBoxOpen, FaCheckCircle, FaTruck, FaMapMarkerAlt, FaUser, FaPrint, FaPhone, FaEnvelope, FaGlobe, FaCalculator, FaLayerGroup } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { sendOrderEmail } from '../../utils/emailService';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter Selection State
  const [filterType, setFilterType] = useState('All'); 

  // Stats Counters
  const onlineCount = orders.filter(o => o.user_id !== 'admin_pos').length;
  const posCount = orders.filter(o => o.user_id === 'admin_pos').length;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const q = query(collection(db, "orders_collection"), orderBy("date", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(data);
        setFilteredOrders(data); // Init with All
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Update filtered list when tab or main data changes
  useEffect(() => {
    if (filterType === 'All') {
      setFilteredOrders(orders);
    } else if (filterType === 'Online') {
      setFilteredOrders(orders.filter(o => o.user_id !== 'admin_pos'));
    } else if (filterType === 'POS') {
      setFilteredOrders(orders.filter(o => o.user_id === 'admin_pos'));
    }
  }, [filterType, orders]);

  const updateStatus = async (order, newStatus) => {
    if(!window.confirm(`Mark order as ${newStatus}?`)) return;
    try {
      await updateDoc(doc(db, "orders_collection", order.id), { status: newStatus });
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
      
      // Only email real customers
      if(order.user_id !== 'admin_pos') await sendOrderEmail(order, newStatus);
      
      alert(`Updated to ${newStatus}`);
    } catch (error) { alert("Update failed"); }
  };

  const getStatusColor = (status) => {
    if(status === 'Delivered') return '#10b981';
    if(status === 'Shipped') return '#3b82f6';
    if(status === 'Cancelled') return '#ef4444';
    return '#f59e0b';
  };

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-content">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, fontSize: '1.3rem' }}>
          <FaBoxOpen /> Manage Customer Orders
        </h3>

        {/* --- TABS WITH COUNTS --- */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', paddingBottom:'15px', borderBottom:'1px solid #e2e8f0', flexWrap: 'wrap' }}>
          
          <button onClick={() => setFilterType('All')}
            className={filterType === 'All' ? "btn" : "btn secondary"}
            style={{ borderRadius: '20px', padding: '8px 20px', display: 'flex', gap: '8px' }}
          >
            <FaLayerGroup /> All Orders <span style={{opacity: 0.7}}>({orders.length})</span>
          </button>

          <button onClick={() => setFilterType('Online')}
            className={filterType === 'Online' ? "btn" : "btn secondary"}
            style={{ borderRadius: '20px', padding: '8px 20px', display: 'flex', gap: '8px', background: filterType === 'Online' ? '#4f46e5' : '#fff' }}
          >
            <FaGlobe /> Online Orders <span style={{background:'rgba(255,255,255,0.2)', padding:'0 6px', borderRadius:'10px', fontSize:'0.8rem'}}>{onlineCount}</span>
          </button>

          <button onClick={() => setFilterType('POS')}
            className={filterType === 'POS' ? "btn" : "btn secondary"}
            style={{ borderRadius: '20px', padding: '8px 20px', display: 'flex', gap: '8px', background: filterType === 'POS' ? '#0ea5e9' : '#fff' }}
          >
            <FaCalculator /> Billing (POS) <span style={{background:'rgba(255,255,255,0.2)', padding:'0 6px', borderRadius:'10px', fontSize:'0.8rem'}}>{posCount}</span>
          </button>

        </div>

        {/* --- ORDERS GRID --- */}
        {loading ? <p>Loading orders...</p> : (
          <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
            
            {filteredOrders.length === 0 ? (
               <div style={{ gridColumn: '1 / -1', padding:'30px', textAlign:'center', color:'#94a3b8', border:'1px dashed #cbd5e1', borderRadius:'8px' }}>
                 No orders found in "{filterType}" category.
               </div>
            ) : (
              filteredOrders.map((order) => (
                <div key={order.id} style={{ 
                  background: 'white', padding: '20px', borderRadius: '10px', 
                  borderTop: `4px solid ${getStatusColor(order.status)}`,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontSize: '0.9rem',
                  position: 'relative', display: 'flex', flexDirection: 'column'
                }}>
                  
                  {/* Badge: Source Type */}
                  <span style={{ 
                    position: 'absolute', top: '12px', left: '15px', fontSize: '0.65rem', fontWeight:'bold', 
                    padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase',
                    background: order.user_id === 'admin_pos' ? '#e0f2fe' : '#eef2ff',
                    color: order.user_id === 'admin_pos' ? '#0369a1' : '#4338ca'
                  }}>
                    {order.user_id === 'admin_pos' ? 'Billing (POS)' : 'Website Order'}
                  </span>

                  {/* 1. Header (Fixed ID and Date Layout) */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dashed #e5e7eb' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1rem', color: '#1f2937' }}>
                        #{order.id.slice(0, 8)}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block' }}>
                        {order.date ? new Date(order.date.seconds * 1000).toLocaleString() : 'N/A'}
                      </span>
                      
                      {/* FIXED: Print Button in Flow */}
                      <Link to={`/print-receipt/${order.id}`} target="_blank" style={{ 
                         display:'inline-flex', alignItems:'center', justifyContent:'flex-end', gap:'5px',
                         fontSize:'0.75rem', marginTop:'5px', color:'#4b5563', textDecoration:'none', 
                         fontWeight:'600', cursor:'pointer' 
                       }}>
                         <FaPrint /> Thermal Print
                      </Link>
                    </div>
                  </div>

                  {/* 2. Customer & Address */}
                  <div style={{ marginBottom: '15px', background:'#f8fafc', padding:'12px', borderRadius:'6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', marginBottom: '6px', color: '#1f2937' }}>
                          <FaUser size={12} style={{ color: '#6b7280' }}/>
                          {order.shipping_details?.fullName || 'Walk-in'} 
                      </div>
                      
                      {order.user_id !== 'admin_pos' ? (
                          <div style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: '1.4' }}>
                             <div style={{display:'flex', gap:'5px'}}>
                               <FaMapMarkerAlt size={12} style={{ color: '#ef4444', marginTop:'3px' }}/>
                               <span>
                                 {order.shipping_details?.houseNo}, {order.shipping_details?.roadName} <br/>
                                 {order.shipping_details?.city}, {order.shipping_details?.state} <br/>
                                 <strong>PIN: {order.shipping_details?.pincode}</strong>
                               </span>
                             </div>
                          </div>
                      ) : (
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Store Sale (Offline)</div>
                      )}

                      {(order.user_phone !== 'N/A' || order.user_email) &&
                        <div style={{ marginTop: '8px', paddingTop:'8px', borderTop:'1px dashed #e2e8f0', fontSize:'0.85rem' }}>
                            {order.user_phone !== 'N/A' && 
                               <div style={{ display:'flex', gap:'6px', alignItems:'center', color:'#334155'}}><FaPhone size={10}/> {order.user_phone}</div>
                            }
                            {order.user_email && order.user_email !== '' &&
                               <div style={{ display:'flex', gap:'6px', alignItems:'center', color:'#6b7280', marginTop:'2px', overflow:'hidden', textOverflow:'ellipsis', fontSize:'0.75rem' }}><FaEnvelope size={10}/> {order.user_email}</div>
                            }
                        </div>
                      }
                  </div>

                  {/* 3. Items */}
                  <div style={{ flexGrow: 1, marginBottom:'10px' }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                          {order.items?.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom:'6px', borderBottom: '1px dashed #f1f5f9' }}>
                              <img src={item.image_url || 'https://via.placeholder.com/40'} alt="" style={{ width:'35px', height:'35px', objectFit:'cover', borderRadius:'4px', border:'1px solid #e2e8f0' }} />
                              <div style={{ flex: 1, fontSize:'0.85rem' }}>
                                  <div style={{fontWeight:'600', lineHeight:'1.1'}}>{item.name}</div>
                                  <div style={{fontSize:'0.7rem', color:'#64748b'}}>
                                     {item.quantity} x ₹{item.price} {item.unit ? `(${item.unit})` : ''}
                                  </div>
                              </div>
                              <div style={{ fontWeight:'700', fontSize:'0.9rem' }}>₹{item.price * item.quantity}</div>
                            </div>
                          ))}
                      </div>
                  </div>

                  {/* Total & Status */}
                  <div style={{ paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems:'center', fontWeight: 'bold', color: '#111827', fontSize:'1rem' }}>
                      <span>Total</span>
                      <span>₹{order.total_amount}</span>
                  </div>

                  {/* 4. Action Buttons (Only for Online Orders mainly) */}
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '15px', borderTop: '1px solid #f3f4f6', marginTop:'10px' }}>
                     {/* POS Orders don't usually need shipping actions, just mark completed visually */}
                     {order.user_id === 'admin_pos' ? (
                        <span style={{ fontSize:'0.8rem', color:'#0ea5e9', fontWeight:'bold', background:'#e0f2fe', padding:'5px 10px', borderRadius:'20px' }}>
                           <FaCheckCircle style={{marginRight:'5px'}}/> Completed (POS)
                        </span>
                     ) : (
                       <>
                         {order.status === 'Pending' && (
                           <button className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#3b82f6' }} onClick={() => updateStatus(order, 'Shipped')}>
                             <FaTruck style={{marginRight:'4px'}}/> Ship
                           </button>
                         )}
                         {order.status === 'Shipped' && (
                           <button className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#10b981' }} onClick={() => updateStatus(order, 'Delivered')}>
                             <FaCheckCircle style={{marginRight:'4px'}}/> Deliver
                           </button>
                         )}
                         {(order.status === 'Delivered' || order.status === 'Cancelled') && (
                           <span style={{ color: getStatusColor(order.status), fontWeight:'bold', fontSize:'0.8rem', background:`${getStatusColor(order.status)}15`, padding:'4px 10px', borderRadius:'15px', display:'flex', alignItems:'center', gap:'4px'}}>
                              {order.status === 'Delivered' ? <FaCheckCircle/> : null} {order.status}
                           </span>
                         )}
                       </>
                     )}
                  </div>

                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageOrders;