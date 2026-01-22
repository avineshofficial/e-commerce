import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import '../../styles/Receipt.css';

const PrintReceipt = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const docRef = doc(db, "orders_collection", id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setOrder({ id: snapshot.id, ...snapshot.data() });
          // Auto Print after short delay for loading
          setTimeout(() => { window.print(); }, 800); 
        }
      } catch (error) { console.error(error); }
    };
    fetchOrder();
  }, [id]);

  if (!order) return <div style={{padding:'20px'}}>Loading Receipt...</div>;

  // Formatting Data
  const shortId = order.id.slice(0, 8).toUpperCase(); 
  
  // Financial Calculations (Handle both legacy and new POS orders)
  const subtotal = order.subtotal || order.total_amount;
  const shipping = order.shipping_cost || 0;
  
  // Calculate Discount amount safely
  let discountAmount = 0;
  if (order.discount_details?.amount) {
     discountAmount = order.discount_details.amount;
  } else if (order.discount_details?.percent) {
     discountAmount = Math.round((subtotal * order.discount_details.percent)/100);
  }

  // Get Tax (New feature)
  const taxAmount = order.tax_amount || 0;

  return (
    <div className="receipt-container">
      {/* 1. STORE HEADER */}
      <div className="receipt-header">
        <h2>NK ENTERPRISES</h2>
        <p>123 Tech Park, Madurai</p>
        <p>Helpline: +91 98765 43210</p>
      </div>

      {/* 2. ORDER META */}
      <div className="receipt-row-split">
        <span><strong>Ord:</strong> #{shortId}</span>
        <span>{order.date ? new Date(order.date.seconds * 1000).toLocaleDateString() : ''}</span>
      </div>
      <div style={{ fontSize: '10px', marginTop: '3px', fontWeight:'bold' }}>
         Payment: {order.payment_mode || 'Cash'}
      </div>

      <div className="receipt-divider"></div>

      {/* 3. CUSTOMER DETAILS */}
      <div className="receipt-meta">
        <strong>TO:</strong> {order.shipping_details?.fullName?.toUpperCase() || 'WALK-IN CUSTOMER'}<br/>
        
        {/* Only show address if it's not a generic counter sale */}
        {order.shipping_details?.houseNo !== 'Counter' && order.shipping_details?.houseNo !== 'Counter Sale' && (
             <span>
               {order.shipping_details?.houseNo}, {order.shipping_details?.roadName}<br/>
               {order.shipping_details?.city} - {order.shipping_details?.pincode}
             </span>
        )}
        
        {order.user_phone && order.user_phone !== 'N/A' && (
           <div style={{ marginTop:'2px' }}>Ph: {order.user_phone}</div>
        )}
      </div>

      <div className="receipt-divider"></div>

      {/* 4. ITEMS TABLE */}
      <table className="receipt-table">
        <thead>
          <tr>
            <th style={{width: '55%'}}>ITEM</th>
            <th style={{width: '15%', textAlign:'center'}}>QTY</th>
            <th style={{width: '30%', textAlign:'right'}}>AMT</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item, idx) => (
            <tr key={idx}>
              <td>
                {item.name.substring(0, 18)} 
                {item.unit && <span style={{fontSize:'9px'}}> ({item.unit})</span>}
              </td>
              <td style={{textAlign:'center'}}>{item.quantity}</td>
              <td style={{textAlign:'right'}}>{item.price * item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="receipt-divider"></div>

      {/* 5. FINANCIALS (Aligned Table) */}
      <table style={{ width: '100%', fontSize: '11px', lineHeight: '1.4' }}>
          <tbody>
            <tr>
              <td style={{ textAlign: 'left' }}>Subtotal:</td>
              <td style={{ textAlign: 'right' }}>{subtotal}</td>
            </tr>

            {discountAmount > 0 && (
              <tr>
                 <td style={{ textAlign: 'left' }}>Discount:</td>
                 <td style={{ textAlign: 'right' }}>-{discountAmount}</td>
              </tr>
            )}

            {taxAmount > 0 && (
              <tr>
                 <td style={{ textAlign: 'left' }}>GST / Tax:</td>
                 <td style={{ textAlign: 'right' }}>+{taxAmount}</td>
              </tr>
            )}

            {shipping > 0 && (
               <tr>
                 <td style={{ textAlign: 'left' }}>Shipping:</td>
                 <td style={{ textAlign: 'right' }}>+{shipping}</td>
              </tr>
            )}
            
            {/* Divider Line */}
            <tr>
              <td colSpan="2">
                 <div style={{ borderBottom:'1px dashed black', margin:'4px 0' }}></div>
              </td>
            </tr>

            <tr style={{ fontSize:'15px', fontWeight:'bold' }}>
               <td style={{ textAlign: 'left' }}>TOTAL:</td>
               <td style={{ textAlign: 'right' }}>₹{order.total_amount}</td>
            </tr>
          </tbody>
      </table>

      {/* 6. FOOTER */}
      <div className="receipt-footer">
        <p>*** THANK YOU! ***</p>
        <p style={{fontSize:'9px'}}>Terms & Conditions Apply</p>
      </div>
    </div>
  );
};

export default PrintReceipt;