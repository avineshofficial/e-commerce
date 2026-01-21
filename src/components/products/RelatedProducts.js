import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import ProductCard from './ProductCard';

const RelatedProducts = ({ currentCategory, currentId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sectionTitle, setSectionTitle] = useState("Similar Products");

  useEffect(() => {
    const fetchRelated = async () => {
      // Avoid fetching if ID isn't ready
      if (!currentId) return;

      setLoading(true);
      const productsRef = collection(db, "products_collection");
      let finalList = [];

      try {
        // --- STRATEGY 1: Fetch Same Category ---
        if (currentCategory) {
          // Fetch more than needed (10) so we can filter out current item and out-of-stock
          const catQuery = query(
            productsRef, 
            where("category", "==", currentCategory),
            limit(10) 
          );
          
          const catSnap = await getDocs(catQuery);
          finalList = catSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(item => item.id !== currentId && item.stock_quantity > 0); // Exclude Current & Sold Out
        }

        // --- STRATEGY 2: Fallback to General Products ---
        // If Strategy 1 returned 0 or 1 item, fill the grid with other active products
        if (finalList.length < 2) {
          setSectionTitle("Recommended For You");
          
          const genQuery = query(
            productsRef, 
            limit(10) // Fetch strictly active products logic implies filtering client side for now to avoid index errors
          );
          
          const genSnap = await getDocs(genQuery);
          const genList = genSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(item => item.id !== currentId && item.stock_quantity > 0);

          // Merge without duplicates
          const existingIds = new Set(finalList.map(p => p.id));
          const newItems = genList.filter(p => !existingIds.has(p.id));
          
          finalList = [...finalList, ...newItems];
        }

        // Limit to 4 items for the UI Grid
        setProducts(finalList.slice(0, 4));

      } catch (error) {
        console.error("Error fetching related:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [currentCategory, currentId]);

  // If no products found at all (empty DB), hide section
  if (!loading && products.length === 0) return null;

  return (
    <div className="related-section" style={{ marginTop: '50px', paddingTop: '30px', borderTop: '1px solid #f1f5f9' }}>
      
      {/* Section Title */}
      <h3 style={{ 
        fontSize: '1.4rem', 
        marginBottom: '20px', 
        color: '#1e293b', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px' 
      }}>
        <span style={{ width:'4px', height:'24px', background:'var(--primary-color)', borderRadius:'2px' }}></span>
        {sectionTitle}
      </h3>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          Loading products...
        </div>
      ) : (
        /* Reusing the Standard Grid System from App.css */
        <div className="product-grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RelatedProducts;