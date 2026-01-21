import React from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaStar, FaHeart, FaRegHeart, FaShareAlt, FaUserFriends, FaImage } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
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
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist(); 
  const toast = useToast();
  
  // Destructure
  const { 
    id, name, image_url, category, featured, description, 
    averageRating = 0, totalReviews = 0, sold_count = 0,
    variants = [] 
  } = product;

  // --- PRICE LOGIC: Get lowest effective price & detect discounts ---
  let displayPrice = Number(product.price);
  let originalPrice = null;
  let maxDiscount = 0;

  if (variants && variants.length > 0) {
    // Calculate effective price for each variant to find best deal/entry price
    const computed = variants.map(v => {
      const price = Number(v.price);
      const discount = Number(v.discount || 0);
      const effective = Math.round(price - (price * discount / 100));
      return { effective, original: price, discount };
    });

    // Use lowest price
    const bestOption = computed.reduce((prev, curr) => curr.effective < prev.effective ? curr : prev);
    
    displayPrice = bestOption.effective;
    if (bestOption.discount > 0) {
      originalPrice = Math.round(bestOption.original);
      maxDiscount = bestOption.discount;
    }
  }

  const isMulti = variants && variants.length > 1;

  // Handlers
  const handleImageError = (e) => {
    e.target.src = PLACEHOLDER_IMG; 
    e.target.style.objectFit = 'contain';
    e.target.style.padding = '20px';
  };

  const handleAddToCart = () => {
    // Basic Add to Cart.
    // NOTE: For multi-variant products, clicking card body -> Details Page is better flow.
    addToCart(product);
    toast.success(`Added ${name} to cart`);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    if (!isInWishlist(id)) toast.info("Added to Wishlist");
    else toast.warning("Removed from Wishlist");
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
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
      
      {/* 1. BADGES (SALE vs TRENDING) */}
      {maxDiscount > 0 ? (
        <span style={{ 
          position: 'absolute', top: '12px', left: '12px', background: '#ef4444', color: 'white', 
          padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', zIndex: 2 
        }}>
          {maxDiscount}% OFF
        </span>
      ) : (featured && (
        <span style={{ 
          position: 'absolute', top: '12px', left: '12px', background: 'var(--primary-color)', color: 'white', 
          padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', zIndex: 2 
        }}>
          Trending
        </span>
      ))}
      
      {/* 2. ACTIONS */}
      <button style={{ ...styles.floatBtn, top: '12px' }} onClick={handleWishlist}>
        {isLiked ? <FaHeart color="#ef4444" /> : <FaRegHeart />}
      </button>

      <button style={{ ...styles.floatBtn, top: '55px' }} onClick={handleShare}>
        <FaShareAlt />
      </button>

      {/* 3. IMAGE */}
      <Link to={`/product/${id}`} style={{textDecoration:'none', color:'inherit', flexGrow: 0}}>
        <div style={styles.imageContainer} className="card-zoom">
          {image_url ? (
            <img 
              src={image_url} 
              alt={name} 
              style={styles.img} 
              onError={handleImageError} 
            />
          ) : (
            <FaImage size={40} color="#cbd5e1" />
          )}
          
          {sold_count > 0 && (
            <div className="sold-badge" style={{
              position: 'absolute', bottom: '0', left: '0', right: '0',
              background: 'rgba(0,0,0,0.7)', color: 'white',
              fontSize: '0.75rem', padding: '6px 15px', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '500'
            }}>
               <FaUserFriends /> {sold_count} sold
            </div>
          )}
        </div>
      </Link>

      {/* 4. DETAILS */}
      <div style={styles.details} className="card-details">
        <small style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>
          {category || 'General'}
        </small>
        
        <Link to={`/product/${id}`} style={{textDecoration:'none', color:'inherit'}}>
          <h3 className="card-title" style={{ margin: '2px 0 5px 0', fontSize: '1.1rem', fontWeight: 600, color: '#1f2937' }}>
            {name}
          </h3>
        </Link>
        
        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom:'5px' }}>
            <div style={{ display: 'flex', color: '#f59e0b', fontSize: '0.8rem' }}>
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} style={{ opacity: i < Math.round(averageRating) ? 1 : 0.3 }} />
              ))}
            </div>
            {totalReviews > 0 && (
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>({totalReviews})</span>
            )}
        </div>

        <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', flexGrow: 1, margin: '5px 0' }}>
          {description ? description.substring(0, 50) + (description.length>50?'...':'') : 'Verified Product.'}
        </p>

        {/* 5. FOOTER (PRICE & ADD BTN) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            
            {/* Old Price Strike */}
            {originalPrice && (
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through', lineHeight: 1 }}>
                ₹{originalPrice}
              </span>
            )}

            <span className="price-tag" style={{ fontSize: '1.25rem', fontWeight: '800', color: maxDiscount > 0 ? '#ef4444' : '#1f2937' }}>
              ₹{displayPrice}
            </span>
            
            {isMulti && (
              <span style={{ fontSize:'0.65rem', color:'#64748b', fontWeight:'500', marginTop:'-2px' }}>
                starts from
              </span>
            )}
          </div>
          
          <button className="btn card-add-btn" onClick={handleAddToCart} 
            style={{ 
              padding: '8px 16px', fontSize: '0.9rem', 
              background: 'var(--primary-color)', color: 'white', 
              borderRadius: '8px', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
            <FaShoppingCart style={{ fontSize:'0.9rem' }}/> Add
          </button>
        </div>
      </div>

      <style>{`
        .product-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .card-zoom:hover img { transform: scale(1.08); }
        .card-add-btn:hover { filter: brightness(1.1); transform: scale(1.02); }
        .product-card button:not(.card-add-btn):hover { background-color: #f8fafc; }

        @media (max-width: 480px) {
          .card-details { padding: 12px !important; }
          .card-title { font-size: 0.95rem !important; margin-bottom: 2px !important; }
          .price-tag { font-size: 1rem !important; }
          .card-add-btn { 
            padding: 6px 10px !important; 
            font-size: 0.75rem !important; 
            border-radius: 6px !important;
          }
          .card-add-btn svg { font-size: 0.75rem !important; }
          .imageContainer { height: 160px !important; }
          .sold-badge { font-size: 0.65rem !important; padding: 4px 8px !important; }
        }
      `}</style>
    </div>
  );
};

export default ProductCard;