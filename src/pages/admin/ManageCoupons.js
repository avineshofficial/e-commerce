import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { FaTicketAlt, FaTrash, FaToggleOn, FaToggleOff, FaPlus } from 'react-icons/fa';
import '../../styles/Form.css';

const ManageCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "coupons"));
      const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCoupons(list);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const upperCode = newCoupon.code.toUpperCase().trim();
    if(!upperCode || !newCoupon.discount) return alert("Code and Discount required");

    if (coupons.some(c => c.code === upperCode)) return alert("Coupon Code already exists!");

    try {
      await addDoc(collection(db, "coupons"), {
        ...newCoupon,
        code: upperCode,
        discount: Number(newCoupon.discount)
      });
      fetchCoupons();
      setNewCoupon({ code: '', discount: '', description: '', isActive: true });
      alert("Coupon Created!");
    } catch (error) {
      alert("Error adding coupon");
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, "coupons", id), { isActive: !currentStatus });
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c));
    } catch (err) { alert("Status update failed"); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this coupon permanently?")) return;
    try {
      await deleteDoc(doc(db, "coupons", id));
      setCoupons(coupons.filter(c => c.id !== id));
    } catch (err) { alert("Error deleting"); }
  };

  return (
    <div className="admin-container">
      <AdminSidebar />
      <main className="admin-content">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
          <FaTicketAlt /> Discount Coupons
        </h2>

        {/* --- ADD COUPON FORM --- */}
        <div className="form-container" style={{ margin: '0 0 30px 0', maxWidth: '100%', padding: '20px' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Create New Code</h4>
          
          {/* UPDATED: Changed from Grid to Flex Wrap for mobile stacking */}
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            
            <input 
              placeholder="CODE (E.G. SALE50)" className="form-input" 
              style={{ textTransform: 'uppercase', fontWeight: 'bold', margin:0, flex: '1 1 200px' }} // Min 200px width
              value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value})} required 
            />
            
            <input 
              type="number" placeholder="Discount %" className="form-input" max="100" min="1"
              style={{ margin:0, flex: '1 1 120px' }} // Min 120px width
              value={newCoupon.discount} onChange={e => setNewCoupon({...newCoupon, discount: e.target.value})} required 
            />
            
            <input 
              placeholder="Description (Optional)" className="form-input" 
              style={{ margin:0, width: '100%' }} // Force full width on new line
              value={newCoupon.description} onChange={e => setNewCoupon({...newCoupon, description: e.target.value})} 
            />
            
            <button type="submit" className="btn" style={{ width: '100%' }}>
              <FaPlus style={{ marginRight:'5px' }} /> Add Coupon
            </button>
          </form>
        </div>

        {/* --- COUPONS LIST --- */}
        {loading ? <p>Loading coupons...</p> : (
          /* UPDATED: Added overflowX auto to fix table squeezing */
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
               <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                 <tr>
                   <th style={{ padding: '15px' }}>Code</th>
                   <th style={{ padding: '15px' }}>Value</th>
                   <th style={{ padding: '15px' }}>Status</th>
                   <th style={{ padding: '15px' }}>Description</th>
                   <th style={{ padding: '15px', textAlign: 'right' }}>Action</th>
                 </tr>
               </thead>
               <tbody>
                 {coupons.length === 0 ? <tr><td colSpan="5" style={{padding:'30px', textAlign:'center', color:'#9ca3af'}}>No coupons created.</td></tr> : 
                   coupons.map(coupon => (
                   <tr key={coupon.id} style={{ borderBottom: '1px solid #f1f5f9', background: coupon.isActive ? 'white' : '#f9fafb' }}>
                     <td style={{ padding: '15px' }}>
                       <span style={{ 
                         background: '#e0f2fe', color: '#0369a1', fontWeight: 'bold', 
                         padding: '5px 10px', borderRadius: '4px', letterSpacing: '1px',
                         border: '1px dashed #0ea5e9', fontSize:'0.9rem'
                       }}>
                         {coupon.code}
                       </span>
                     </td>
                     <td style={{ padding: '15px', fontWeight: 'bold', color: '#16a34a' }}>
                       {coupon.discount}% OFF
                     </td>
                     <td style={{ padding: '15px' }}>
                       <button onClick={() => toggleStatus(coupon.id, coupon.isActive)} 
                         style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}
                       >
                         {coupon.isActive ? <FaToggleOn size={22} color="#16a34a"/> : <FaToggleOff size={22} color="#9ca3af"/>}
                         <span style={{ color: coupon.isActive ? '#16a34a' : '#9ca3af' }}>{coupon.isActive ? 'Active' : 'Disabled'}</span>
                       </button>
                     </td>
                     <td style={{ padding: '15px', color: '#64748b', fontSize: '0.9rem', maxWidth:'200px' }}>
                       {coupon.description || '-'}
                     </td>
                     <td style={{ padding: '15px', textAlign: 'right' }}>
                       <button onClick={() => handleDelete(coupon.id)} className="btn secondary" style={{ color: '#ef4444', background: '#fee2e2' }}>
                         <FaTrash />
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageCoupons;