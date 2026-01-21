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
          setTimeout(() => { window.print(); }, 800); 
        }
      } catch (error) { console.error(error); }
    };
    fetchOrder();
  }, [id]);

  if (!order) return <div style={{padding:'20px'}}>Generating...</div>;

  // Shorten ID for receipt
  const shortId = order.id.slice(0, 8).toUpperCase(); 

  // Calculation variables
  const subtotal = order.subtotal || order.total_amount;
  const discountAmount = order.discount_details?.code ? Math.round((subtotal * order.discount_details.percent)/100) : 0;
  const shipping = order.shipping_cost || 0;

  return (
    <div className="receipt-container">
      {/* 1. Header */}
      <div className="receipt-header">
        <h2>NK ENTERPRISES</h2>
        <p>123 Tech Park, Mumbai - 400001</p>
        <p>Ph: +91 98765 43210</p>
      </div>

      {/* 2. Order Meta */}
      <div className="receipt-row-split">
        <span><strong>OrderID:</strong> #{shortId}</span>
        <span  style={{margin:'5px'}}>{order.date ? new Date(order.date.seconds * 1000).toLocaleDateString() : ''}</span>
      </div>

      {/* Added Payment Mode Here */}
      <div style={{ fontSize: '10px', marginTop: '3px', fontWeight:'bold' }}>
         Mode: {order.payment_mode || 'Cash on Delivery'}
      </div>
      
      <div className="receipt-divider"></div>

      {/* 3. Customer */}
      <div className="receipt-meta">
        <strong>TO:</strong> {order.shipping_details?.fullName?.toUpperCase() || 'CUSTOMER'}<br/>
        {order.shipping_details?.houseNo !== 'Counter' && (
             <span>
               {order.shipping_details?.houseNo}, {order.shipping_details?.roadName}<br/>
               {order.shipping_details?.city} - <strong>{order.shipping_details?.pincode}</strong>
             </span>
        )}
        {order.user_phone !== 'N/A' && <div>Ph: {order.user_phone}</div>}
      </div>

      <div className="receipt-divider"></div>

      {/* 4. Items Table */}
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

      {/* 5. Totals (Table Layout) */}
      <table style={{ width: '100%', fontSize: '11px', lineHeight: '1.4' }}>
          <tbody>
            <tr>
              <td style={{ textAlign: 'left' }}>Subtotal:</td>
              <td style={{ textAlign: 'right' }}>{subtotal}</td>
            </tr>

            {order.discount_details?.code && (
              <tr>
                 <td style={{ textAlign: 'left' }}>Disc ({order.discount_details.code}):</td>
                 <td style={{ textAlign: 'right' }}>-{discountAmount}</td>
              </tr>
            )}

            <tr>
               <td style={{ textAlign: 'left' }}>Shipping:</td>
               <td style={{ textAlign: 'right' }}>{shipping > 0 ? shipping : 'Free'}</td>
            </tr>
            
            <tr>
              <td colSpan="2">
                 <div style={{ borderBottom:'1px dashed black', margin:'2px 0' }}></div>
              </td>
            </tr>

            <tr style={{ fontSize:'14px', fontWeight:'bold' }}>
               <td style={{ textAlign: 'left' }}>PAYABLE:</td>
               <td style={{ textAlign: 'right' }}>₹{order.total_amount}</td>
            </tr>
          </tbody>
      </table>

      {/* 6. Footer */}
      <div className="receipt-footer">
        <p>*** THANK YOU! ***</p>
      </div>
    </div>
  );
};

export default PrintReceipt;