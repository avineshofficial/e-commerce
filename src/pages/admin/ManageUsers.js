import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { FaUsers, FaSearch, FaHistory, FaPhone, FaMapMarkerAlt, FaEnvelope } from 'react-icons/fa';
import '../../styles/Admin.css'; // Reusing standard Admin styles

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch Users and Orders to map data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Users
        const usersSnap = await getDocs(collection(db, "users_collection"));
        const usersList = usersSnap.docs.map(doc => ({ 
          uid: doc.id, 
          ...doc.data() 
        }));

        // Fetch Orders (to count Total Orders per user)
        const ordersSnap = await getDocs(collection(db, "orders_collection"));
        const ordersList = ordersSnap.docs.map(doc => ({
            userId: doc.data().user_id,
            total: doc.data().total_amount
        }));

        setUsers(usersList);
        setOrders(ordersList);
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper: Get stats for specific user
  const getUserStats = (uid) => {
    const userOrders = orders.filter(o => o.userId === uid);
    const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    return {
        count: userOrders.length,
        spent: totalSpent
    };
  };

  // Search Logic
  const filteredUsers = users.filter(user => 
    (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.phoneNumber && user.phoneNumber.includes(searchTerm)) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <FaUsers /> Customer Database
            <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 'normal' }}>
               ({users.length})
            </span>
          </h2>
          
          <div style={{ position: 'relative' }}>
             <FaSearch style={{ position: 'absolute', left: '12px', top: '10px', color: '#9ca3af' }} />
             <input 
               type="text" 
               placeholder="Search by Phone or Name..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="form-input"
               style={{ paddingLeft: '35px', margin: 0, width: '250px' }}
             />
          </div>
        </div>

        {loading ? <p>Loading Customer Data...</p> : (
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                <tr>
                  <th style={{ padding: '16px' }}>User Details</th>
                  <th style={{ padding: '16px' }}>Contact</th>
                  <th style={{ padding: '16px' }}>Location</th>
                  <th style={{ padding: '16px' }}>Orders</th>
                  <th style={{ padding: '16px' }}>Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>No users found.</td></tr>
                ) : (
                    filteredUsers.map(user => {
                      const stats = getUserStats(user.uid);
                      
                      return (
                        <tr key={user.uid} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-row">
                          <td style={{ padding: '16px' }}>
                            <div style={{ fontWeight: '600', color: '#1f2937' }}>{user.displayName || 'Guest User'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>ID: {user.uid.slice(0, 8)}...</div>
                          </td>
                          <td style={{ padding: '16px', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <FaPhone size={10} color="#6b7280" /> {user.phone_number || user.phoneNumber || 'N/A'}
                            </div>
                            {user.email && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaEnvelope size={10} color="#6b7280" /> {user.email}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '16px', fontSize: '0.9rem', color: '#4b5563' }}>
                             {user.city ? (
                               <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                 <FaMapMarkerAlt size={10} color="#64748b"/> {user.city}
                               </span>
                             ) : <span style={{ color: '#cbd5e1' }}>-</span>}
                          </td>
                          <td style={{ padding: '16px' }}>
                             <span style={{ 
                               background: '#e0f2fe', color: '#0369a1', fontWeight: 'bold', 
                               padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem',
                               display: 'flex', alignItems: 'center', width: 'fit-content', gap: '5px'
                             }}>
                               <FaHistory /> {stats.count} Orders
                             </span>
                          </td>
                          <td style={{ padding: '16px', fontWeight: '700', color: '#059669' }}>
                             ₹{stats.spent.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
      
      {/* Table Hover Effect */}
      <style>{`
        .hover-row:hover { background-color: #f8fafc; }
      `}</style>
    </div>
  );
};

export default ManageUsers;