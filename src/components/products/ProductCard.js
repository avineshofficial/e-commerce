import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaStar, FaHeart, FaRegHeart, FaShareAlt, FaUserFriends, FaImage } from 'react-icons/fa';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';

// Placeholder for broken images
const PLACEHOLDER_IMG = "https://via.placeholder.com/300x300?text=No+Image";

const styles = {
  card: {
    backgroundColor: 'var(--bg-surface, #fff)',
    borderRadius: '16px',
    boxShadow: 'var(--shadow, 0 4px 6px -1px rgba(0,0,0,0.1))',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    border: '1px solid #f3f4f6'
  },
  imageContainer: {
    height: '240px',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.5s ease'
  },
  details: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: '0.5rem'
  },
  floatBtn: {
    position: 'absolute',
    right: '12px',
    background: 'white',
    borderRadius: '50%',
    width: '35px',
    height: '35px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
    border: 'none',
    fontSize: '1rem',
    color: '#475569'
  }
};

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist(); 
  const toast = useToast();
  
  const { 
    id, name, image_url, category, featured, description, 
    averageRating = 0, totalReviews = 0, sold_count = 0,
    variants = [] 
  } = product;

  // --- PRICE LOGIC (Display Only) ---
  let displayPrice = Number(product.price);
  let originalPrice = null;
  let maxDiscount = 0;

  if (variants && variants.length > 0) {
    const computed = variants.map(v => {
      const p = Number(v.price);
      const d = Number(v.discount || 0);
      const effective = Math.round(p - (p * d / 100));
      return { effective, original: p, discount: d, stock: Number(v.stock) };
    });

    const bestOption = computed.reduce((prev, curr) => curr.effective < prev.effective ? curr : prev);
    displayPrice = bestOption.effective;
    
    if (bestOption.discount > 0) {
      originalPrice = Math.round(bestOption.original);
      maxDiscount = bestOption.discount;
    }
  }

  // --- STOCK LOGIC ---
  const totalAvailableStock = variants && variants.length > 0 
    ? variants.reduce((sum, v) => sum + Number(v.stock), 0)
    : Number(product.stock_quantity || 0);

  const isOutOfStock = totalAvailableStock <= 0;

  // --- ACTIONS ---
  
  const handleImageError = (e) => {
    e.target.src = PLACEHOLDER_IMG; 
    e.target.style.padding = '20px';
  };

  // CHANGE: Redirects to details page instead of adding to cart
  const handleViewProduct = () => {
    navigate(`/product/${id}`);
  };

  const handleWishlist = (e) => {
    e.preventDefault(); e.stopPropagation();
    toggleWishlist(product);
    if (!isInWishlist(id)) toast.info("Added to Wishlist");
    else toast.warning("Removed from Wishlist");
  };

  const handleShare = async (e) => {
    e.preventDefault(); e.stopPropagation();
    const shareUrl = `${window.location.origin}/product/${id}`;
    if (navigator.share) {
      try { await navigator.share({ title: name, url: shareUrl }); } catch (e){}
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.info("Link copied to clipboard");
    }
  };

  const isLiked = isInWishlist(id);

  return (
    <div className="product-card" style={styles.card}>
      
      {/* BADGES */}
      {isOutOfStock ? (
         <span style={{ position: 'absolute', top: '12px', left: '12px', background: '#94a3b8', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', zIndex: 2 }}>
            Out of Stock
         </span>
      ) : maxDiscount > 0 ? (
        <span style={{ position: 'absolute', top: '12px', left: '12px', background: '#ef4444', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', zIndex: 2 }}>
          {maxDiscount}% OFF
        </span>
      ) : featured && (
        <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--primary-color)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', zIndex: 2 }}>
          Trending
        </span>
      )}
      
      {/* FLOAT BUTTONS */}
      <button style={{ ...styles.floatBtn, top: '12px' }} onClick={handleWishlist}>
        {isLiked ? <FaHeart color="#ef4444" /> : <FaRegHeart />}
      </button>

      <button style={{ ...styles.floatBtn, top: '55px' }} onClick={handleShare}>
        <FaShareAlt />
      </button>

      {/* IMAGE (Clicking image also goes to details) */}
      <Link to={`/product/${id}`} style={{textDecoration:'none', color:'inherit', flexGrow: 0}}>
        <div style={styles.imageContainer} className="card-zoom">
          <img src={image_url || PLACEHOLDER_IMG} alt={name} style={styles.img} onError={handleImageError} />
          
          {/* UPDATED: Show count if > 0 (previously > 5) */}
          {sold_count > 0 && (
            <div className="sold-badge" style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.75rem', padding: '6px 15px', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '500' }}>
               <FaUserFriends /> {sold_count} bought this
            </div>
          )}
        </div>
      </Link>

      {/* INFO */}
      <div style={styles.details} className="card-details">
        <small style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>
          {category || 'General'}
        </small>
        
        <Link to={`/product/${id}`} style={{textDecoration:'none', color:'inherit'}}>
          <h3 className="card-title" style={{ margin: '2px 0 5px 0', fontSize: '1.1rem', fontWeight: 600, color: '#1f2937' }}>{name}</h3>
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom:'5px' }}>
            <div style={{ display: 'flex', color: '#f59e0b', fontSize: '0.8rem' }}>
              {[...Array(5)].map((_, i) => <FaStar key={i} style={{ opacity: i < Math.round(averageRating) ? 1 : 0.3 }} />)}
            </div>
            {totalReviews > 0 && <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>({totalReviews})</span>}
        </div>

        <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', flexGrow: 1, margin: '5px 0' }}>
          {description ? description.substring(0, 45) + (description.length>45?'...':'') : 'Premium quality.'}
        </p>

        {/* PRICE & BUTTON */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {originalPrice && <span style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through', lineHeight: 1 }}>₹{originalPrice}</span>}
            <span className="price-tag" style={{ fontSize: '1.25rem', fontWeight: '800', color: maxDiscount > 0 ? '#ef4444' : '#1f2937' }}>₹{displayPrice}</span>
          </div>
          
          {/* Button changed to "View" to prevent direct cart/stock errors */}
          <button 
            className="btn card-add-btn" 
            onClick={handleViewProduct} 
            disabled={isOutOfStock}
            style={{ 
              padding: '8px 16px', fontSize: '0.85rem', 
              background: isOutOfStock ? '#e2e8f0' : '#e0e7ff', 
              color: isOutOfStock ? '#94a3b8' : 'var(--primary-color)',
              borderRadius: '8px', border: isOutOfStock ? 'none' : '1px solid var(--primary-color)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
            
            {isOutOfStock ? (
                <span>No Stock</span>
            ) : (
                <><FaEye /> View</> 
            )}

          </button>
        </div>
      </div>

      <style>{`
        .product-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .card-zoom:hover img { transform: scale(1.08); }
        .card-add-btn:hover:not(:disabled) { background: var(--primary-color) !important; color: white !important; }
        
        @media (max-width: 480px) {
          .card-details { padding: 12px !important; }
          .card-title { font-size: 0.95rem !important; margin-bottom: 2px !important; }
          .price-tag { font-size: 1rem !important; }
          .card-add-btn { padding: 6px 10px !important; font-size: 0.7rem !important; border-radius: 6px !important; }
          .imageContainer { height: 160px !important; }
          .sold-badge { font-size: 0.65rem !important; padding: 4px 8px !important; }
        }
      `}</style>
    </div>
  );
};

export default ProductCard;