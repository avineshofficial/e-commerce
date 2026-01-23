import React, { useMemo } from 'react';
import { useWishlist } from '../../context/WishlistContext';
import { useProducts } from '../../context/ProductContext'; // Import Live Data source
import ProductCard from '../../components/products/ProductCard';
import { Link } from 'react-router-dom';
import { FaHeart, FaArrowRight, FaRegSadTear } from 'react-icons/fa';

const Wishlist = () => {
  const { wishlist } = useWishlist();
  const { products } = useProducts(); // Get array of all current products

  // SYNCHRONIZATION LOGIC:
  // Map through the saved wishlist items and find their matching "Fresh" version 
  // in the products list. If found, use the fresh one (with correct stock/price).
  // If not found (maybe products still loading or item deleted), fallback to saved version.
  const displayItems = useMemo(() => {
    return wishlist.map(savedItem => {
      const liveProduct = products.find(p => p.id === savedItem.id);
      return liveProduct || savedItem;
    });
  }, [wishlist, products]);

  return (
    <div className="container" style={{ minHeight: '60vh', padding: '2rem 1rem' }}>
      
      {/* HEADER */}
      <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '30px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: 'var(--text-main)' }}>
          <FaHeart style={{ color: '#ef4444' }} /> 
          My Wishlist <span style={{fontSize:'1rem', color:'#666', fontWeight:'normal'}}>({displayItems.length})</span>
        </h2>
      </div>

      {/* CONTENT */}
      {displayItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <div style={{fontSize:'3rem', color:'#cbd5e1', marginBottom:'10px'}}>
             <FaRegSadTear />
          </div>
          <h3 style={{color: '#64748b', margin:'0 0 10px 0'}}>Your wishlist is empty</h3>
          <p style={{ color: '#94a3b8', marginBottom: '25px', fontSize:'0.9rem' }}>
            Tap the heart icon on any product to save it here.
          </p>
          <Link to="/" className="btn" style={{ padding: '12px 25px' }}>
            Browse Products <FaArrowRight style={{ marginLeft:'5px'}} />
          </Link>
        </div>
      ) : (
        /* GRID - Using displayItems (Fresh Data) instead of stale wishlist */
        <div className="product-grid">
          {displayItems.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;