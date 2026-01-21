import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc, orderBy, query } from 'firebase/firestore';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { FaEnvelope, FaTrash, FaEnvelopeOpen, FaReply, FaClock } from 'react-icons/fa';
import { useToast } from '../../context/ToastContext';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const q = query(collection(db, "inquiries_collection"), orderBy("date", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await deleteDoc(doc(db, "inquiries_collection", id));
      setMessages(prev => prev.filter(m => m.id !== id));
      toast.info("Message deleted.");
    } catch (error) {
      toast.error("Failed to delete.");
    }
  };

  const handleMarkRead = async (id, currentStatus) => {
    if (currentStatus === 'Read') return;
    try {
      await updateDoc(doc(db, "inquiries_collection", id), { status: 'Read' });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'Read' } : m));
      toast.success("Marked as read.");
    } catch (error) { console.error(error); }
  };

  return (
    <div className="admin-container">
      <AdminSidebar />
      <main className="admin-content">
        
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
          <FaEnvelope /> Customer Inquiries
          <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 'normal' }}>
            ({messages.filter(m => m.status !== 'Read').length} Unread)
          </span>
        </h2>

        {loading ? <p>Loading Inbox...</p> : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '8px' }}>
            <p style={{ color: '#9ca3af' }}>No messages found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {messages.map(msg => (
              <div 
                key={msg.id} 
                onClick={() => handleMarkRead(msg.id, msg.status)}
                style={{ 
                  background: 'white', padding: '20px', borderRadius: '8px', 
                  borderLeft: msg.status === 'Unread' ? '5px solid var(--primary-color)' : '5px solid #e2e8f0',
                  boxShadow: 'var(--shadow)', cursor: 'pointer', transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'flex-start' }}>
                  <div>
                     <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                       {msg.subject || 'No Subject'}
                       {msg.status === 'Unread' && <span style={{ fontSize: '0.7rem', background: '#e0f2fe', color: '#0284c7', padding: '2px 6px', borderRadius: '4px' }}>NEW</span>}
                     </h4>
                     <div style={{ fontSize: '0.9rem', color: '#4b5563', marginTop: '4px' }}>
                       From: <strong>{msg.name}</strong> &lt;{msg.email}&gt;
                     </div>
                  </div>
                  <div style={{ textAlign: 'right', color: '#9ca3af', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FaClock size={12}/> {msg.date ? new Date(msg.date.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px', color: '#374151', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  {msg.message}
                </div>

                <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                   {/* Reply via Email Client */}
                   <a 
                     href={`mailto:${msg.email}?subject=Re: ${msg.subject}`} 
                     className="btn secondary"
                     style={{ fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
                     onClick={(e) => e.stopPropagation()} // Stop bubbling (don't toggle read)
                   >
                     <FaReply /> Reply
                   </a>

                   {msg.status === 'Unread' && (
                     <button 
                       className="btn" 
                       style={{ fontSize: '0.85rem', padding: '6px 12px', background: '#3b82f6' }}
                       onClick={(e) => { e.stopPropagation(); handleMarkRead(msg.id, 'Unread'); }}
                     >
                       <FaEnvelopeOpen style={{ marginRight: '5px'}}/> Mark Read
                     </button>
                   )}

                   <button 
                     onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }}
                     style={{ 
                       background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 12px', 
                       borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' 
                     }}
                   >
                     <FaTrash />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminMessages;