import emailjs from '@emailjs/browser';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

// ⚠️ YOUR EMAILJS KEYS
const SERVICE_ID = "service_h92aqla"; 
const TEMPLATE_ID = "template_2nu69qp";
const PUBLIC_KEY = "ENkIaUUzC0eHgL35b";

export const sendOrderEmail = async (orderData, status) => {
  // 1. Basic Validation
  if (!orderData?.user_email) {
    console.warn("No email provided in order data");
    return;
  }

  // 2. CHECK USER PREFERENCE (Default = OFF Logic)
  // Skip this check for Guest/POS orders who don't have a profile doc
  if (orderData.user_id && orderData.user_id !== 'admin_pos') {
    try {
       const userSnap = await getDoc(doc(db, "users_collection", orderData.user_id));
       
       if (userSnap.exists()) {
         const userData = userSnap.data();
         const settings = userData.settings || {}; // Handle if settings field is missing

         // --- STRICT LOGIC CHANGE ---
         // Previously: Only blocked if explicitly 'false'.
         // NOW: Only sends if explicitly 'true'. 
         // If undefined, null, or false -> IT WILL RETURN (No Email).
         if (settings.orderUpdates !== true) {
           console.log("🚫 Email skipped: User settings are OFF or not yet enabled.");
           return; 
         }
       } else {
         // If user doc doesn't exist, we assume Default is OFF
         console.log("🚫 Email skipped: No user profile found (Default OFF).");
         return;
       }
    } catch (e) {
      console.error("Error checking settings, blocking email for safety.", e);
      return; 
    }
  }

  // 3. Format Data
  const customerName = orderData.shipping_details?.fullName || "Valued Customer";
  
  // Format Product List
  const items = orderData.items || [];
  const productDetails = items.map(item => 
    `• ${item.name} (x${item.quantity}) - ₹${item.price * item.quantity}`
  ).join('\n');

  // Format Address
  const shipping = orderData.shipping_details || {};
  const addressDetails = shipping.houseNo 
    ? `${shipping.houseNo}, ${shipping.roadName || ''}, ${shipping.city || ''}, ${shipping.state || ''} - ${shipping.pincode || ''}. ${shipping.landmark ? '(Landmark: '+shipping.landmark+')' : ''}`
    : "Pickup / No Address provided";

  // Dynamic Subject & Message
  let subjectLine = `Order Update #${orderData.id}`;
  let messageIntro = "";

  if (status === 'Processing') {
    subjectLine = `Order Confirmation #${orderData.id}`;
    messageIntro = "Thank you for your purchase! We have received your order.";
  } else if (status === 'Shipped') {
    subjectLine = `Order #${orderData.id} Shipped 🚚`;
    messageIntro = "Good news! Your items have been dispatched and are on the way.";
  } else if (status === 'Delivered') {
    subjectLine = `Order #${orderData.id} Delivered ✅`;
    messageIntro = "Your order has been delivered successfully. Thank you for choosing NK Enterprises!";
  } else if (status === 'Cancelled') {
    subjectLine = `Order #${orderData.id} Cancelled ❌`;
    messageIntro = "This order has been cancelled as per request.";
  }

  // 4. Send Email
  const templateParams = {
    to_name: customerName,
    to_email: orderData.user_email,
    subject: subjectLine,
    message_intro: messageIntro,
    order_id: orderData.id,
    product_list: productDetails, 
    total_price: `₹${orderData.total_amount}`,
    shipping_address: addressDetails,
    date: new Date().toLocaleDateString()
  };

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log(`✅ Email successfully sent to ${orderData.user_email}`);
  } catch (error) {
    console.error("❌ EmailJS Error:", error);
    // Don't use alert() here to prevent disrupting Admin flow
  }
};