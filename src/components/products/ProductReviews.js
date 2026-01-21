import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { 
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, 
  doc, updateDoc, deleteDoc, getDocs 
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FaStar, FaUser, FaPen, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import '../../styles/Reviews.css';

const ProductReviews = ({ productId }) => {
  const { currentUser } = useAuth();
  const toast = useToast();
  
  const [reviews, setReviews] = useState([]);
  const [showAll, setShowAll] = useState(false); // To toggle list length
  const [showForm, setShowForm] = useState(false); // For new review
  
  // Create State
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ rating: 0, comment: '' });

  // 1. Listen for Real-time Reviews
  useEffect(() => {
    if (!productId) return;
    const reviewsRef = collection(db, `products_collection/${productId}/reviews`);
    const q = query(reviewsRef, orderBy("date", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(data);
    });
    return () => unsubscribe();
  }, [productId]);

  // HELPER: Recalculate Average for Parent Product
  const recalculateParentRating = async () => {
    try {
      // Must fetch fresh data directly
      const q = query(collection(db, `products_collection/${productId}/reviews`));
      const snap = await getDocs(q);
      const allReviews = snap.docs.map(doc => doc.data());

      if (allReviews.length > 0) {
        const totalScore = allReviews.reduce((sum, r) => sum + r.rating, 0);
        const newAvg = totalScore / allReviews.length;
        
        await updateDoc(doc(db, "products_collection", productId), {
          averageRating: newAvg,
          totalReviews: allReviews.length
        });
      } else {
        // No reviews left
        await updateDoc(doc(db, "products_collection", productId), {
          averageRating: 0,
          totalReviews: 0
        });
      }
    } catch (e) { console.error("Recalculation error", e); }
  };

  // 2. CREATE
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return toast.error("Please login first");
    if (!newReview.comment.trim()) return toast.warning("Comment is empty");

    try {
      await addDoc(collection(db, `products_collection/${productId}/reviews`), {
        ...newReview,
        userName: currentUser.displayName || 'User',
        userId: currentUser.uid,
        date: serverTimestamp()
      });
      setNewReview({ rating: 5, comment: '' });
      setShowForm(false);
      toast.success("Review added");
      setTimeout(recalculateParentRating, 1000); // Wait for write
    } catch (error) { toast.error("Error submitting review"); }
  };

  // 3. DELETE
  const handleDelete = async (reviewId) => {
    if(!window.confirm("Delete this review?")) return;
    try {
      await deleteDoc(doc(db, `products_collection/${productId}/reviews`, reviewId));
      toast.info("Review deleted");
      setTimeout(recalculateParentRating, 1000);
    } catch(err) { toast.error("Delete failed"); }
  };

  // 4. EDIT
  const startEdit = (review) => {
    setEditingId(review.id);
    setEditData({ rating: review.rating, comment: review.comment });
  };

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, `products_collection/${productId}/reviews`, editingId), {
        rating: editData.rating,
        comment: editData.comment,
        isEdited: true
      });
      setEditingId(null);
      toast.success("Review updated");
      setTimeout(recalculateParentRating, 1000);
    } catch(err) { toast.error("Update failed"); }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 0;

  // Slicing logic: Show first 3 unless showAll is true
  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <div className="reviews-section">
      
      {/* HEADER */}
      <div className="reviews-header">
        <div className="rating-summary">
           <div className="average-score">{averageRating > 0 ? averageRating : 'N/A'}</div>
           <div>
             <div className="stars-display">
               {[...Array(5)].map((_, i) => (
                 <FaStar key={i} color={i < Math.round(averageRating) ? "#f59e0b" : "#e2e8f0"} />
               ))}
             </div>
             <small style={{ color: '#6b7280' }}>Based on {reviews.length} reviews</small>
           </div>
        </div>
        <button className="btn" style={{padding:'8px 15px', fontSize:'0.9rem'}} onClick={() => setShowForm(!showForm)}>
           {showForm ? 'Cancel' : <><FaPen style={{ marginRight: '6px' }}/> Write Review</>}
        </button>
      </div>

      {/* CREATE FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} className="review-form">
          <h4 style={{ margin: '0 0 10px 0', fontSize:'0.95rem' }}>Your Rating:</h4>
          <div style={{ display:'flex', gap:'5px', marginBottom:'15px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button type="button" key={star} onClick={() => setNewReview({ ...newReview, rating: star })} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem', color: newReview.rating >= star ? '#f59e0b' : '#cbd5e1' }}>
                <FaStar />
              </button>
            ))}
          </div>
          <textarea className="form-textarea" rows="2" placeholder="Write your experience..." value={newReview.comment} onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })} />
          <button type="submit" className="btn" style={{ fontSize: '0.8rem', padding:'8px 20px', marginTop:'10px' }}>Post</button>
        </form>
      )}

      {/* REVIEWS LIST */}
      <div className="reviews-list">
        {reviews.length === 0 ? <p style={{ textAlign:'center', color:'#9ca3af' }}>No reviews yet.</p> : (
          displayedReviews.map((rev) => (
            <div key={rev.id} className="review-item">
              
              <div className="review-header-row">
                {/* User & Date */}
                <div>
                  <div className="review-user">
                    <div className="user-avatar"><FaUser /></div>
                    <div style={{display:'flex', flexDirection:'column', lineHeight:'1.2'}}>
                      <span>{rev.userName} {rev.isEdited && <span style={{fontSize:'0.6rem', color:'#9ca3af'}}>(edited)</span>}</span>
                      <span className="review-date">
                        {rev.date ? new Date(rev.date.seconds * 1000).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit/Delete Buttons (Only if Owner) */}
                {currentUser?.uid === rev.userId && editingId !== rev.id && (
                  <div className="user-actions">
                    <button className="action-btn btn-edit" onClick={() => startEdit(rev)}>
                      <FaEdit /> Edit
                    </button>
                    <button className="action-btn btn-delete" onClick={() => handleDelete(rev.id)}>
                      <FaTrash />
                    </button>
                  </div>
                )}
              </div>

              {/* Editing Mode OR Viewing Mode */}
              {editingId === rev.id ? (
                <div className="edit-input-area">
                   <div style={{marginBottom:'5px'}}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <FaStar key={s} style={{cursor:'pointer', color: s <= editData.rating ? '#f59e0b':'#e2e8f0'}} onClick={()=>setEditData({...editData, rating:s})}/>
                      ))}
                   </div>
                   <textarea className="edit-textarea" value={editData.comment} onChange={(e)=>setEditData({...editData, comment: e.target.value})} />
                   <div style={{display:'flex', gap:'10px'}}>
                      <button className="btn" style={{padding:'5px 10px', fontSize:'0.75rem', background:'#10b981'}} onClick={handleUpdate}><FaCheck/> Save</button>
                      <button className="btn secondary" style={{padding:'5px 10px', fontSize:'0.75rem'}} onClick={()=>setEditingId(null)}><FaTimes/> Cancel</button>
                   </div>
                </div>
              ) : (
                <>
                  <div className="review-stars">
                    {[...Array(5)].map((_, i) => <FaStar key={i} style={{ opacity: i < rev.rating ? 1 : 0.3 }} />)}
                  </div>
                  <p className="review-text">{rev.comment}</p>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* SEE ALL TOGGLE */}
      {reviews.length > 3 && (
        <div className="show-all-container">
          <button className="btn-link" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show Less' : `View All ${reviews.length} Reviews`}
          </button>
        </div>
      )}

    </div>
  );
};

export default ProductReviews;