import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FaPrint, FaArrowLeft, FaTag, FaMapMarkerAlt, FaBoxOpen, FaPhone, FaEnvelope } from 'react-icons/fa';
import '../../styles/Invoice.css';

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const docRef = doc(db, "orders_collection", id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setOrder({ id: snapshot.id, ...snapshot.data() });
        }
      } catch (error) { 
        console.error("Error fetching order details:", error); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <div style={{textAlign:'center', marginTop:'50px', color:'#666'}}>Loading Invoice Details...</div>;
  
  if (!order) return (
    <div className="container" style={{padding:'50px', textAlign:'center'}}>
        <h2>Order Not Found</h2>
        <Link to="/dashboard" className="btn">Return to My Orders</Link>
    </div>
  );

  return (
    <div className="container">
      {/* Back Button */}
      <div className="back-btn" style={{ maxWidth: '800px', margin: '20px auto 10px auto' }}>
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: '#6b7280' }}>
          <FaArrowLeft /> Back to My Orders
        </Link>
      </div>

      <div className="invoice-container" id="printable-area">
        
        {/* 1. Header Section */}
        <div className="invoice-header">
          <div className="invoice-brand">
            <h2>Order Details</h2>
            <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop:'5px' }}>ORDER ID: #{order.id}</div>
          </div>
          <div className="invoice-status">
             <h3 style={{ margin: 0, color: order.status === 'Delivered' ? '#10b981' : order.status === 'Cancelled' ? '#ef4444' : '#f59e0b' }}>
               {order.status}
             </h3>
             <span style={{ fontSize:'0.9rem', color:'#64748b' }}>
                {order.date ? new Date(order.date.seconds * 1000).toDateString() : ''}
             </span>
             <div style={{ fontSize: '0.8rem', marginTop:'4px', color:'#334155' }}>Payment: {order.payment_mode || 'COD'}</div>
          </div>
        </div>

        {/* 2. Addresses & Items Grid */}
        <div style={{ display: 'grid', gridTemplateColumns:'1fr 1fr', gap:'30px', marginBottom:'30px' }}>
           
           {/* Shipping Address */}
           <div style={{ paddingRight: '20px', borderRight: '1px solid #f3f4f6' }}>
              <h4 style={{ margin:'0 0 12px 0', display:'flex', gap:'8px', alignItems:'center', color:'#475569', borderBottom:'1px solid #f3f4f6', paddingBottom:'8px' }}>
                <FaMapMarkerAlt size={14}/> Delivery Address
              </h4>
              <p style={{ margin:0, lineHeight:1.6, fontSize:'0.95rem', color:'#334155' }}>
                <strong style={{ fontSize:'1rem' }}>{order.shipping_details?.fullName}</strong> <br/>
                {order.shipping_details?.houseNo}, {order.shipping_details?.roadName} <br/>
                {order.shipping_details?.city} - <strong>{order.shipping_details?.pincode}</strong> <br/>
                {order.shipping_details?.landmark && <span style={{fontSize:'0.85rem', color:'#666'}}>Landmark: {order.shipping_details?.landmark}<br/></span>}
              </p>
              
              <div style={{ marginTop:'10px', paddingTop:'10px', borderTop:'1px dashed #e2e8f0', fontSize:'0.9rem' }}>
                <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px'}}>
                    <FaPhone size={12} color="#94a3b8"/> {order.user_phone}
                </div>
                {order.user_email && (
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <FaEnvelope size={12} color="#94a3b8"/> {order.user_email}
                    </div>
                )}
              </div>
           </div>

           {/* Items List */}
           <div>
              <h4 style={{ margin:'0 0 12px 0', display:'flex', gap:'8px', alignItems:'center', color:'#475569', borderBottom:'1px solid #f3f4f6', paddingBottom:'8px' }}>
                <FaBoxOpen size={14}/> Items Ordered
              </h4>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {order.items?.map((item, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.9rem', alignItems:'flex-start' }}>
                        <div style={{ display:'flex', gap:'10px' }}>
                            <img 
                                src={item.image_url || 'https://via.placeholder.com/40'} 
                                alt="" 
                                style={{ width:'35px', height:'35px', borderRadius:'4px', objectFit:'cover', border:'1px solid #eee' }} 
                            />
                            <div>
                                <span style={{ fontWeight:'600', color:'#1f2937' }}>{item.name}</span>
                                <div style={{ fontSize:'0.75rem', color:'#6b7280' }}>
                                    Qty: {item.quantity} {item.unit && `(${item.unit})`}
                                </div>
                            </div>
                        </div>
                        <span style={{ fontWeight:'500' }}>₹{item.price * item.quantity}</span>
                    </div>
                ))}
              </div>
           </div>
        </div>

        {/* 3. FINANCIAL BREAKDOWN (Updated with Shipping Logic) */}
        <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '20px', marginTop: '20px', textAlign: 'right' }}>
           <div style={{ maxWidth: '300px', marginLeft: 'auto' }}>
              
              {/* Subtotal */}
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                 <span style={{color:'#64748b'}}>Subtotal:</span>
                 <span style={{color:'#334155', fontWeight:'500'}}>
                    ₹{order.subtotal || order.total_amount}
                 </span> 
              </div>

              {/* Discount (if applicable) */}
              {order.discount_details?.code && (
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px', color:'#16a34a' }}>
                   <span style={{display:'flex', alignItems:'center', gap:'5px'}}>
                     <FaTag size={12}/> Coupon ({order.discount_details.code}):
                   </span>
                   <span>- ₹{Math.round((order.subtotal * order.discount_details.percent)/100)}</span>
                </div>
              )}

              {/* NEW: Shipping Cost Display */}
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px', color:'#475569' }}>
                 <span>Shipping Charges:</span>
                 <span>
                    {/* Check explicitly for number, fallback if field missing on old orders */}
                    {order.shipping_cost > 0 
                        ? `₹${order.shipping_cost}` 
                        : <span style={{color:'#16a34a', fontWeight:'bold'}}>Free</span>
                    }
                 </span>
              </div>

              {/* Grand Total */}
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'15px', borderTop:'1px solid #e2e8f0', paddingTop:'15px', fontSize:'1.3rem', fontWeight:'800', color:'var(--primary-color)' }}>
                 <span>Total Paid:</span>
                 <span>₹{order.total_amount}</span>
              </div>
           </div>
        </div>

        {/* Footer Notes */}
        <div style={{ marginTop:'40px', paddingTop:'20px', borderTop:'1px solid #f1f5f9', fontSize:'0.8rem', color:'#9ca3af', textAlign:'center' }}>
            Thank you for shopping with NK Enterprises. <br/>
            For support, please contact <strong>support@nkenterprises.com</strong>
        </div>

      </div>
      
      {/* Print Action */}
      <button className="btn print-btn" onClick={() => window.print()}>
        <FaPrint style={{ marginRight:'8px' }}/> Print Official Receipt
      </button>
    </div>
  );
};

export default OrderDetails;