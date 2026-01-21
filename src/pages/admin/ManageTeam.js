import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { FaUserShield, FaSearch, FaUserPlus, FaUserMinus } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Admin.css';

const ManageTeam = () => {
  // 1. ALL HOOKS MUST BE DECLARED FIRST (Before any return statements)
  const { userRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // 2. Define Effects and Functions
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const q = query(collection(db, "users_collection"), where("email", "==", searchTerm.trim()));
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(list);
    } catch (error) { alert("Error searching user"); }
    setLoading(false);
  };

  useEffect(() => {
      const fetchStaff = async () => {
          try {
            const q = query(collection(db, "users_collection"), where("role", "==", "staff"));
            const snap = await getDocs(q);
            setStaffList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          } catch(e) { console.error("Error fetching staff", e); }
      };
      
      // Only fetch if admin to avoid permission errors
      if (userRole === 'admin') {
        fetchStaff();
      }
  }, [userRole]);

  const changeRole = async (userId, newRole) => {
      if(!window.confirm(`Change role to ${newRole}?`)) return;
      try {
          await updateDoc(doc(db, "users_collection", userId), { role: newRole });
          alert("Role Updated!");
          window.location.reload(); 
      } catch (e) { alert("Failed to update"); }
  };

  // 3. NOW we can do the Security Check (Early Return)
  // Since all hooks above have registered, React won't complain.
  if (userRole !== 'admin') {
      return (
        <div className="admin-container">
            <AdminSidebar />
            <div className="admin-content" style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'80vh', color:'#991b1b' }}>
                <h3>🚫 Access Denied: Restricted to Super Admin Only.</h3>
            </div>
        </div>
      );
  }

  // 4. Main Render
  return (
    <div className="admin-container">
      <AdminSidebar />
      <main className="admin-content">
        <h2 style={{ display:'flex', alignItems:'center', gap:'10px' }}><FaUserShield/> Manage Staff Team</h2>
        <p style={{ color: '#666', marginBottom:'30px' }}>
            Staff members can Manage Orders, Inquiries, and Inventory updates.<br/>
            <strong>Staff cannot:</strong> View Total Revenue, Delete Products, or Download Reports.
        </p>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'40px' }}>
            
            {/* LEFT: Search User to Add */}
            <div style={{ background:'white', padding:'25px', borderRadius:'12px', border:'1px solid #e5e7eb' }}>
                <h3 style={{ marginTop:0 }}>Add New Staff</h3>
                <form onSubmit={handleSearch} style={{ display:'flex', gap:'10px' }}>
                    <input 
                        className="form-input" 
                        placeholder="Enter user email..." 
                        value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                        style={{marginBottom:0}}
                    />
                    <button className="btn" type="submit" disabled={loading}><FaSearch/></button>
                </form>

                <div style={{ marginTop:'20px' }}>
                    {users.map(u => (
                        <div key={u.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px', background:'#f8fafc', borderRadius:'8px', marginBottom:'10px' }}>
                            <div style={{ overflow:'hidden' }}>
                                <strong style={{ fontSize:'0.9rem' }}>{u.displayName || 'User'}</strong><br/>
                                <small style={{ color:'#666', fontSize:'0.75rem' }}>{u.email}</small>
                            </div>
                            <button className="btn" style={{ padding:'5px 10px', fontSize:'0.8rem' }} onClick={() => changeRole(u.id, 'staff')}>
                                <FaUserPlus style={{marginRight:'5px'}}/> Promote
                            </button>
                        </div>
                    ))}
                    {users.length === 0 && !loading && <p style={{color:'#aaa', fontSize:'0.9rem'}}>Search a registered email to promote them.</p>}
                </div>
            </div>

            {/* RIGHT: Active Staff List */}
            <div style={{ background:'white', padding:'25px', borderRadius:'12px', border:'1px solid #e5e7eb' }}>
                <h3 style={{ marginTop:0, color:'var(--primary-color)' }}>Active Staff Members ({staffList.length})</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    {staffList.map(s => (
                        <div key={s.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #f1f5f9', paddingBottom:'10px' }}>
                            <div style={{ overflow:'hidden' }}>
                                <span style={{fontWeight:'bold', fontSize:'0.9rem'}}>{s.displayName}</span> <br/>
                                <small style={{color:'#666', fontSize:'0.75rem'}}>{s.email}</small>
                            </div>
                            <button className="btn secondary" style={{ color:'#ef4444', background:'#fee2e2', padding:'5px 10px', fontSize:'0.8rem' }} onClick={() => changeRole(s.id, 'user')}>
                                <FaUserMinus /> Revoke
                            </button>
                        </div>
                    ))}
                    {staffList.length === 0 && <p style={{color:'#aaa'}}>No staff assigned.</p>}
                </div>
            </div>

        </div>
      </main>
    </div>
  );
};

export default ManageTeam;