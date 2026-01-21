import React from 'react';
import { useWishlist } from '../../context/WishlistContext';
import ProductCard from '../../components/products/ProductCard';
import { Link } from 'react-router-dom';
import { FaHeart, FaArrowRight } from 'react-icons/fa';

const Wishlist = () => {
  const { wishlist } = useWishlist();

  return (
    <div className="container" style={{ minHeight: '60vh', padding: '2rem 1rem' }}>
      
      {/* HEADER SECTION FIX */}
      <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '30px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: 'var(--text-main)' }}>
          {/* Icon stays Red (#ef4444), Text inherits theme color */}
          <FaHeart style={{ color: '#ef4444' }} /> 
          My Wishlist ({wishlist.length})
        </h2>
      </div>

      {/* EMPTY STATE */}
      {wishlist.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <FaHeart size={40} style={{ color: '#e2e8f0', marginBottom: '15px' }} />
          <h3 style={{color: '#64748b'}}>Your wishlist is empty</h3>
          <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Save items you love here for later.</p>
          <Link to="/" className="btn" style={{ padding: '12px 25px' }}>
            Browse Products <FaArrowRight style={{ marginLeft:'5px'}} />
          </Link>
        </div>
      ) : (
        /* PRODUCT GRID (Uses App.css fixes automatically) */
        <div className="grid">
          {wishlist.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;