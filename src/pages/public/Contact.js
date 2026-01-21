import React, { useState } from 'react';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaPaperPlane } from 'react-icons/fa';
import { db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';
import '../../styles/Form.css';    // Reuse Input styles
import '../../styles/Support.css'; // New Layout styles

const Contact = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Save message to Firestore
      await addDoc(collection(db, "inquiries_collection"), {
        ...formData,
        date: serverTimestamp(),
        status: 'Unread'
      });

      toast.success("Message sent! We'll reply shortly.");
      setFormData({ name: '', email: '', subject: '', message: '' }); // Reset
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container support-container" style={{ padding: '3rem 1.5rem' }}>
      
      {/* 1. Header Section */}
      <div className="contact-header">
        <h2>Get in Touch</h2>
        <p>Have questions about our products, shipping, or your order? We're here to help.</p>
      </div>

      <div className="contact-grid">
        
        {/* 2. Left: Info Column */}
        <div>
          <div className="contact-info-card">
            <h3 style={{ marginBottom: '25px', marginTop: 0 }}>Contact Info</h3>
            
            <div className="info-item">
              <div className="info-icon"><FaPhoneAlt /></div>
              <div className="info-text">
                <h4>Phone</h4>
                <p>+91 98765 43210</p>
                <p style={{ fontSize: '0.8rem' }}>Mon-Sat 9am - 6pm</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon"><FaEnvelope /></div>
              <div className="info-text">
                <h4>Email</h4>
                <p>support@nkenterprises.com</p>
                <p>sales@nkenterprises.com</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon"><FaMapMarkerAlt /></div>
              <div className="info-text">
                <h4>Office Address</h4>
                <p>NK Tech Park, Unit 101,</p>
                <p>Sector 15, Mumbai, Maharashtra 400001</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Right: Form Column */}
        <div className="contact-form-card">
          <h3 style={{ margin: '0 0 20px 0' }}>Send us a Message</h3>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Your Name</label>
              <input 
                type="text" name="name" className="form-input" 
                placeholder="John Doe" required
                value={formData.name} onChange={handleChange} 
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" name="email" className="form-input" 
                placeholder="john@example.com" required
                value={formData.email} onChange={handleChange} 
              />
            </div>

            <div className="form-group">
              <label>Subject</label>
              <select name="subject" className="form-select" value={formData.subject} onChange={handleChange} required>
                <option value="">Select a Topic</option>
                <option value="Order Status">Order Status Inquiry</option>
                <option value="Product Support">Product Support</option>
                <option value="Returns">Returns & Refunds</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea 
                name="message" className="form-textarea" rows="5" 
                placeholder="How can we help you today?" required
                value={formData.message} onChange={handleChange}
              />
            </div>

            <button type="submit" disabled={loading} className="btn" style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Sending...' : <><FaPaperPlane style={{marginRight:'8px'}}/> Send Message</>}
            </button>
          </form>
        </div>
      </div>

      {/* 4. Map Placeholder (Embedded Frame for Visual Appeal) */}
      <div className="map-container">
        <iframe 
          title="Map Location"
          width="100%" 
          height="100%" 
          frameBorder="0" 
          scrolling="no" 
          marginHeight="0" 
          marginWidth="0" 
          style={{ border: 0, filter: 'grayscale(0.2)' }}
          src="https://maps.google.com/maps?q=Mumbai&t=&z=13&ie=UTF8&iwloc=&output=embed">
        </iframe>
      </div>
    </div>
  );
};

export default Contact;