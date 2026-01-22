import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, orderBy, query, updateDoc, doc } from 'firebase/firestore';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { FaBoxOpen, FaCheckCircle, FaTruck, FaMapMarkerAlt, FaUser, FaPrint, FaPhone, FaEnvelope, FaGlobe, FaCalculator, FaLayerGroup, FaTimesCircle } from 'react-icons/fa';
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

  // 1. Fetch Orders
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

  // 2. Filter Logic
  useEffect(() => {
    if (filterType === 'All') {
      setFilteredOrders(orders);
    } else if (filterType === 'Online') {
      setFilteredOrders(orders.filter(o => o.user_id !== 'admin_pos'));
    } else if (filterType === 'POS') {
      setFilteredOrders(orders.filter(o => o.user_id === 'admin_pos'));
    }
  }, [filterType, orders]);

  // 3. Status Update & Email
  const updateStatus = async (order, newStatus) => {
    if(!window.confirm(`Mark order as ${newStatus}?`)) return;
    
    try {
      await updateDoc(doc(db, "orders_collection", order.id), { status: newStatus });
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
      
      // Only email real customers (Online Orders)
      if(order.user_id !== 'admin_pos') await sendOrderEmail(order, newStatus);
      
      alert(`Updated to ${newStatus}`);
    } catch (error) { 
      console.error(error);
      alert("Update failed"); 
    }
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
          <FaBoxOpen /> Manage Orders
        </h3>

        {/* --- FILTER TABS --- */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', paddingBottom:'15px', borderBottom:'1px solid #e2e8f0', flexWrap: 'wrap' }}>
          
          <button onClick={() => setFilterType('All')}
            className={filterType === 'All' ? "btn" : "btn secondary"}
            style={{ borderRadius: '20px', padding: '8px 16px', display: 'flex', gap: '6px', fontSize:'0.9rem' }}
          >
            <FaLayerGroup /> All ({orders.length})
          </button>

          <button onClick={() => setFilterType('Online')}
            className={filterType === 'Online' ? "btn" : "btn secondary"}
            style={{ borderRadius: '20px', padding: '8px 16px', display: 'flex', gap: '6px', background: filterType === 'Online' ? '#4f46e5' : '#fff', color: filterType === 'Online'?'#fff':'#64748b', fontSize:'0.9rem' }}
          >
            <FaGlobe /> Online <span style={{background:'rgba(255,255,255,0.3)', padding:'0 5px', borderRadius:'10px', fontSize:'0.75rem'}}>{onlineCount}</span>
          </button>

          <button onClick={() => setFilterType('POS')}
            className={filterType === 'POS' ? "btn" : "btn secondary"}
            style={{ borderRadius: '20px', padding: '8px 16px', display: 'flex', gap: '6px', background: filterType === 'POS' ? '#0ea5e9' : '#fff', color: filterType === 'POS'?'#fff':'#64748b', fontSize:'0.9rem' }}
          >
            <FaCalculator /> Billing <span style={{background:'rgba(255,255,255,0.3)', padding:'0 5px', borderRadius:'10px', fontSize:'0.75rem'}}>{posCount}</span>
          </button>

        </div>

        {/* --- ORDERS LIST GRID --- */}
        {loading ? <p>Loading orders...</p> : (
          <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', width: '100%' }}>
            
            {filteredOrders.length === 0 ? (
               <div style={{ gridColumn: '1 / -1', padding:'30px', textAlign:'center', color:'#94a3b8', border:'1px dashed #cbd5e1', borderRadius:'8px' }}>
                 No orders found in "{filterType}" category.
               </div>
            ) : (
              filteredOrders.map((order) => (
                <div key={order.id} style={{ 
                  background: 'white', padding: '15px', borderRadius: '10px', 
                  borderTop: `4px solid ${getStatusColor(order.status)}`,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontSize: '0.9rem',
                  position: 'relative', display: 'flex', flexDirection: 'column',
                  maxWidth: '100%' // Ensure card doesn't exceed screen width
                }}>
                  
                  {/* Badge: Source Type */}
                  <span style={{ 
                    position: 'absolute', top: '10px', left: '10px', fontSize: '0.65rem', fontWeight:'bold', 
                    padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase',
                    background: order.user_id === 'admin_pos' ? '#f3e8ff' : '#e0f2fe',
                    color: order.user_id === 'admin_pos' ? '#7e22ce' : '#0369a1'
                  }}>
                    {order.user_id === 'admin_pos' ? 'POS / BILLING' : 'WEBSITE ORDER'}
                  </span>

                  {/* 1. Header (ID, Date, Print) */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px dashed #e5e7eb' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1rem', color: '#1f2937' }}>
                        #{order.id.slice(0, 8)}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block' }}>
                        {order.date ? new Date(order.date.seconds * 1000).toLocaleString() : 'N/A'}
                      </span>
                      
                      {/* Thermal Print Button */}
                      <Link to={`/print-receipt/${order.id}`} target="_blank" style={{ 
                         display:'inline-flex', alignItems:'center', justifyContent:'flex-end', gap:'5px',
                         fontSize:'0.75rem', marginTop:'4px', color:'#4b5563', textDecoration:'none', 
                         fontWeight:'600', cursor:'pointer' 
                       }}>
                         <FaPrint /> Thermal Print
                      </Link>
                    </div>
                  </div>

                  {/* 2. Customer & Address (FIX: ADDED WORD BREAK) */}
                  <div style={{ marginBottom: '15px', background:'#f8fafc', padding:'10px', borderRadius:'6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', marginBottom: '6px', color: '#1f2937' }}>
                          <FaUser size={12} style={{ color: '#6b7280' }}/>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                            {order.shipping_details?.fullName || 'Walk-in'}
                          </span>
                      </div>
                      
                      {/* Address: Logic to hide long address if POS */}
                      {order.user_id !== 'admin_pos' ? (
                          <div style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: '1.4', wordBreak: 'break-word' }}>
                             <div style={{display:'flex', gap:'5px', alignItems:'flex-start'}}>
                               <FaMapMarkerAlt size={12} style={{ color: '#ef4444', marginTop:'3px', flexShrink: 0 }}/>
                               <div>
                                 <div>{order.shipping_details?.houseNo}, {order.shipping_details?.roadName}</div>
                                 <div>{order.shipping_details?.city} - <strong>{order.shipping_details?.pincode}</strong></div>
                               </div>
                             </div>
                          </div>
                      ) : (
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Store Counter Sale</div>
                      )}

                      {(order.user_phone !== 'N/A' || order.user_email) &&
                        <div style={{ marginTop: '8px', paddingTop:'8px', borderTop:'1px dashed #e2e8f0', fontSize:'0.85rem', wordBreak:'break-all' }}>
                            {order.user_phone !== 'N/A' && 
                               <div style={{ display:'flex', gap:'6px', alignItems:'center', color:'#334155'}}>
                                  <FaPhone size={10} color="#64748b"/> {order.user_phone}
                               </div>
                            }
                            {order.user_email && order.user_email !== '' &&
                               <div style={{ display:'flex', gap:'6px', alignItems:'center', color:'#6b7280', marginTop:'4px' }}>
                                  <FaEnvelope size={10}/> {order.user_email}
                               </div>
                            }
                        </div>
                      }
                  </div>

                  {/* 3. Items List */}
                  <div style={{ flexGrow: 1, marginBottom:'10px' }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                          {order.items?.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom:'6px', borderBottom: '1px dashed #f1f5f9' }}>
                              <img 
                                  src={item.image_url || 'https://via.placeholder.com/40'} 
                                  alt=""
                                  style={{ width:'40px', height:'40px', objectFit:'cover', borderRadius:'4px', border:'1px solid #e2e8f0', background:'white', flexShrink: 0 }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{fontWeight:'600', lineHeight:'1.1', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontSize:'0.85rem'}}>{item.name}</div>
                                  <div style={{fontSize:'0.75rem', color:'#64748b'}}>
                                     {item.quantity} x ₹{item.price} {item.unit ? <span style={{background:'#f1f5f9', padding:'1px 4px', borderRadius:'3px'}}>{item.unit}</span> : ''}
                                  </div>
                              </div>
                              <div style={{ fontWeight:'700', fontSize:'0.9rem', flexShrink: 0 }}>₹{item.price * item.quantity}</div>
                            </div>
                          ))}
                      </div>
                  </div>

                  {/* Total & Footer */}
                  <div style={{ paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems:'center', fontWeight: 'bold', color: '#111827', fontSize:'1rem' }}>
                      <span>Total ({order.payment_mode || 'COD'})</span>
                      <span>₹{order.total_amount}</span>
                  </div>

                  {/* 4. Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '15px', borderTop: '1px solid #f3f4f6', marginTop:'10px', flexWrap:'wrap' }}>
                     
                     {/* IF POS -> Completed */}
                     {order.user_id === 'admin_pos' ? (
                        <span style={{ fontSize:'0.8rem', color:'#0ea5e9', fontWeight:'bold', background:'#e0f2fe', padding:'5px 10px', borderRadius:'20px' }}>
                           <FaCheckCircle style={{marginRight:'5px'}}/> Completed (POS)
                        </span>
                     ) : (
                       // IF Online -> Show Buttons
                       <>
                         {order.status === 'Pending' && (
                           <button className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#3b82f6', whiteSpace:'nowrap' }} onClick={() => updateStatus(order, 'Shipped')}>
                             <FaTruck style={{marginRight:'4px'}}/> Ship
                           </button>
                         )}
                         
                         {order.status === 'Shipped' && (
                           <button className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#10b981', whiteSpace:'nowrap' }} onClick={() => updateStatus(order, 'Delivered')}>
                             <FaCheckCircle style={{marginRight:'4px'}}/> Deliver
                           </button>
                         )}
                         
                         {order.status === 'Delivered' && (
                           <span style={{ color: '#10b981', fontWeight:'bold', fontSize:'0.8rem', background: '#ecfdf5', padding:'5px 10px', borderRadius:'15px', display:'flex', alignItems:'center' }}>
                              <FaCheckCircle style={{marginRight:'4px'}}/> Delivered
                           </span>
                         )}

                         {order.status === 'Cancelled' && (
                           <span style={{ color: '#ef4444', fontWeight:'bold', fontSize:'0.8rem', background: '#fef2f2', padding:'5px 10px', borderRadius:'15px', display:'flex', alignItems:'center' }}>
                              <FaTimesCircle style={{marginRight:'4px'}}/> Cancelled
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