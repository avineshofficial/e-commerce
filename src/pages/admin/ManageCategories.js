import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { FaTrash, FaPlus, FaToggleOn, FaToggleOff, FaLayerGroup } from 'react-icons/fa';
import '../../styles/Form.css';

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState('');

  // 1. Fetch Categories from Firestore
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "categories"));
      const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (list.length === 0) {
        setCategories([]);
      } else {
        setCategories(list);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Add New Category
  const handleAdd = async (e) => {
    e.preventDefault();
    const cleanName = newCategory.trim();
    if(!cleanName) return;

    if (categories.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
        alert("Category already exists!");
        return;
    }

    try {
      await addDoc(collection(db, "categories"), {
        name: cleanName,
        value: cleanName.toLowerCase().replace(/\s+/g, '_'),
        isActive: true,
        count: 0 
      });
      fetchCategories();
      setNewCategory('');
      alert("Category Created!");
    } catch (error) {
      alert("Error adding category");
    }
  };

  // 3. Toggle Status (Active/Hidden)
  const toggleStatus = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, "categories", id), { isActive: !currentStatus });
      setCategories(prev => prev.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c));
    } catch (err) { alert("Status update failed"); }
  };

  // 4. Delete Category
  const handleDelete = async (id) => {
    if(!window.confirm("Permanently delete this category?")) return;
    try {
      await deleteDoc(doc(db, "categories", id));
      setCategories(categories.filter(c => c.id !== id));
    } catch (err) { alert("Error deleting"); }
  };

  return (
    <div className="admin-container">
      <AdminSidebar />
      
      <main className="admin-content">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
          <FaLayerGroup /> Manage Product Categories
        </h2>

        {/* --- ADD CATEGORY FORM --- */}
        <div className="form-container" style={{ margin: '0 0 30px 0', maxWidth: '100%', padding: '20px' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Add New Category</h4>
          
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <input 
              placeholder="Category Name (e.g. Home Decor)" className="form-input" 
              value={newCategory} onChange={e => setNewCategory(e.target.value)} required 
              style={{ margin: 0, flex: 1, minWidth: '200px' }}
            />
            
            <button type="submit" className="btn" style={{ whiteSpace: 'nowrap' }}>
              <FaPlus style={{ marginRight: '5px'}}/> Add Category
            </button>
          </form>
        </div>

        {/* --- CATEGORY LIST TABLE --- */}
        {loading ? <p>Loading...</p> : (
          /* Changed 'overflow: hidden' to 'overflowX: auto' for mobile scroll support */
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
               <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                 <tr>
                   <th style={{ padding: '15px' }}>Category Name</th>
                   <th style={{ padding: '15px' }}>Slug (Value)</th>
                   <th style={{ padding: '15px' }}>Status</th>
                   <th style={{ padding: '15px', textAlign: 'right' }}>Action</th>
                 </tr>
               </thead>
               <tbody>
                 {categories.length === 0 ? (
                    <tr>
                        <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                            No categories found. Start adding some!
                        </td>
                    </tr>
                 ) : (
                   categories.map(cat => (
                   <tr key={cat.id} style={{ borderBottom: '1px solid #f1f5f9', background: cat.isActive ? 'white' : '#f9fafb' }}>
                     <td style={{ padding: '15px', fontWeight: '600', color: '#334155' }}>
                       {cat.name}
                     </td>
                     <td style={{ padding: '15px', fontFamily: 'monospace', color: '#64748b' }}>
                       {cat.value}
                     </td>
                     <td style={{ padding: '15px' }}>
                       <button onClick={() => toggleStatus(cat.id, cat.isActive)} 
                         style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}
                       >
                         {cat.isActive ? <FaToggleOn size={24} color="#10b981"/> : <FaToggleOff size={24} color="#94a3b8"/>}
                         <span style={{ color: cat.isActive ? '#10b981' : '#94a3b8', fontWeight: '500' }}>
                           {cat.isActive ? 'Active' : 'Inactive'}
                         </span>
                       </button>
                     </td>
                     <td style={{ padding: '15px', textAlign: 'right' }}>
                       <button onClick={() => handleDelete(cat.id)} className="btn secondary" style={{ color: '#ef4444', background: '#fee2e2' }}>
                         <FaTrash />
                       </button>
                     </td>
                   </tr>
                 )))}
               </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageCategories;