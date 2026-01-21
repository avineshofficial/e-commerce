import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { documentId, collection, query, where, getDocs } from 'firebase/firestore';
import ProductCard from './ProductCard';
import { FaHistory } from 'react-icons/fa';

/**
 * Handles fetching and displaying products based on LocalStorage IDs.
 * Should be placed at the bottom of Home or Product Details.
 */
const RecentlyViewed = ({ excludeId }) => {
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      // 1. Get IDs from LocalStorage
      const viewedIds = JSON.parse(localStorage.getItem('nk_recently_viewed') || '[]');
      
      // Filter out the current product we are looking at (if any)
      const validIds = viewedIds.filter(id => id !== excludeId).slice(0, 4); // Limit to 4 items

      if (validIds.length === 0) return;

      setLoading(true);
      try {
        // 2. Query Firestore for these specific IDs
        const productsRef = collection(db, "products_collection");
        const q = query(productsRef, where(documentId(), "in", validIds));
        
        const querySnapshot = await getDocs(q);
        const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // 3. Sort them to match the "Recent" order (Firestone 'IN' query scrambles order)
        const sortedProducts = validIds.map(id => products.find(p => p.id === id)).filter(Boolean);
        
        setRecentProducts(sortedProducts);
      } catch (error) {
        console.error("Error fetching history", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentlyViewed();
  }, [excludeId]);

  if (loading || recentProducts.length === 0) return null;

  return (
    <div className="recent-container" style={{ marginTop: '60px', paddingBottom: '20px' }}>
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: '10px', 
        marginBottom: '20px', borderLeft: '5px solid #6b7280', paddingLeft: '15px' 
      }}>
        <FaHistory style={{ color: '#6b7280' }} />
        <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.5rem' }}>Your Recent Views</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {recentProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewed;