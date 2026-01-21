import emailjs from '@emailjs/browser';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

// ⚠️ REPLACE WITH YOUR REAL EMAILJS KEYS
const SERVICE_ID = "service_h92aqla"; 
const TEMPLATE_ID = "template_2nu69qp";
const PUBLIC_KEY = "ENkIaUUzC0eHgL35b";

export const sendOrderEmail = async (orderData, status) => {
  // 1. Validation
  if (!orderData?.user_email) {
    console.warn("No email provided in order data");
    return;
  }

  // 2. Check User Preference (Optional: Fetch if they have notifications enabled)
  // If you want to force transactional emails regardless of setting, skip this block.
  try {
     const userSnap = await getDoc(doc(db, "users_collection", orderData.user_id));
     if (userSnap.exists()) {
       const settings = userSnap.data().settings;
       // If user explicitly turned OFF order updates, stop. (Default is true)
       if (settings && settings.orderUpdates === false) {
         console.log("User has disabled order email notifications.");
         return; 
       }
     }
  } catch (e) {
    console.error("Error checking settings, attempting to send anyway.");
  }

  // 3. Format Data for Email
  const customerName = orderData.shipping_details?.fullName || "Valued Customer";
  
  // Format Product List (Name x Qty = Price)
  const productDetails = orderData.items.map(item => 
    `• ${item.name} (x${item.quantity}) - ₹${item.price * item.quantity}`
  ).join('\n');

  // Format Full Address
  const addressDetails = `
    ${orderData.shipping_details?.houseNo}, ${orderData.shipping_details?.roadName},
    ${orderData.shipping_details?.city}, ${orderData.shipping_details?.state} - ${orderData.shipping_details?.pincode}.
    Landmark: ${orderData.shipping_details?.landmark || 'N/A'}
  `;

  // Dynamic Subject/Message
  let subjectLine = `Order Update #${orderData.id}`;
  let messageIntro = "";

  if (status === 'Processing') {
    subjectLine = `Order Placed Successfully #${orderData.id}`;
    messageIntro = "Thank you for your purchase! We are processing your order.";
  } else if (status === 'Shipped') {
    subjectLine = `Order #${orderData.id} Shipped!`;
    messageIntro = "Good news! Your items are packed and on the way.";
  } else if (status === 'Delivered') {
    subjectLine = `Order #${orderData.id} Delivered`;
    messageIntro = "Your item has been delivered. Enjoy your purchase!";
  } else if (status === 'Cancelled') {
    subjectLine = `Order #${orderData.id} Cancelled`;
    messageIntro = "This order has been cancelled as per request.";
  }

  // 4. Params to send to EmailJS Template
  const templateParams = {
    to_name: customerName,
    to_email: orderData.user_email, // Target User (e.g. savinesh011@gmail.com)
    subject: subjectLine,
    message_intro: messageIntro,
    order_id: orderData.id,
    product_list: productDetails, // Pass the formatted string
    total_price: `₹${orderData.total_amount}`,
    shipping_address: addressDetails,
    date: new Date().toLocaleDateString()
  };

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log(`✅ Email sent to ${orderData.user_email}`);
  } catch (error) {
    console.error("❌ EmailJS Error:", error);
    alert("Email Notification could not be sent.");
  }
};