import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
// REMOVED 'orderBy' and 'query' to bypass index requirement
import { collectionGroup, getDocs, deleteDoc, doc } from 'firebase/firestore'; 
import AdminSidebar from '../../components/admin/AdminSidebar';
import { FaStar, FaTrash, FaCommentDots, FaUser, FaExclamationTriangle } from 'react-icons/fa';
import '../../styles/Admin.css'; 

const ManageReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. SIMPLE QUERY: Fetch ALL reviews without sorting (Bypasses Index error)
      const querySnapshot = await getDocs(collectionGroup(db, 'reviews'));
      
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        productId: doc.ref.parent.parent ? doc.ref.parent.parent.id : 'Unknown',
        ...doc.data()
      }));

      // 2. CLIENT-SIDE SORT: Sort by date here in the browser
      // (Newest First)
      data.sort((a, b) => {
        const dateA = a.date ? a.date.seconds : 0;
        const dateB = b.date ? b.date.seconds : 0;
        return dateB - dateA;
      });

      setReviews(data);
    } catch (error) {
      console.error("Reviews Error:", error);
      // Fallback error handling
      if (error.code === 'failed-precondition' || error.code === 'permission-denied') {
        setErrorMsg("Check Firebase Console -> Firestore -> Rules tab. Ensure Collection Group queries are allowed.");
      } else {
        setErrorMsg("Failed to load reviews: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId, productId) => {
    if(!window.confirm("Permanently delete this review?")) return;
    try {
      const reviewRef = doc(db, `products_collection/${productId}/reviews`, reviewId);
      await deleteDoc(reviewRef);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (error) {
      alert("Failed to delete review");
    }
  };

  return (
    <div className="admin-container">
      <AdminSidebar />
      <main className="admin-content">
        
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
          <FaCommentDots /> Moderation: Product Reviews
        </h2>

        {errorMsg && (
          <div style={{ padding: '20px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <FaExclamationTriangle size={24} />
            <div>
              <strong>Action Required:</strong> {errorMsg}
            </div>
          </div>
        )}

        {loading ? <p>Loading feedback...</p> : (
          <div style={{ display: 'grid', gap: '20px' }}>
            
            {reviews.length === 0 && !errorMsg ? (
               <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                 <p style={{ color: '#94a3b8' }}>No user reviews submitted yet.</p>
               </div>
            ) : (
              reviews.map(review => (
                <div key={review.id} style={{ 
                  background: 'white', padding: '20px', borderRadius: '8px', 
                  boxShadow: 'var(--shadow)', border: '1px solid #f1f5f9' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#e0e7ff', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <FaUser size={14} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#1f2937' }}>{review.userName || 'Anonymous'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                          {review.date ? new Date(review.date.seconds * 1000).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDelete(review.id, review.productId)}
                      className="btn secondary" 
                      style={{ background: '#fee2e2', color: '#ef4444', height: 'fit-content', padding: '8px 12px' }}
                      title="Delete Review"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', color: '#f59e0b', fontSize: '0.9rem' }}>
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} style={{ opacity: i < review.rating ? 1 : 0.3 }} />
                    ))}
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '0.95rem', color: '#334155', fontStyle: review.comment ? 'normal' : 'italic' }}>
                    "{review.comment || 'No text provided.'}"
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageReviews;