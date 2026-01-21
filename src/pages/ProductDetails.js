import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { FaShoppingCart, FaArrowLeft, FaCheck } from 'react-icons/fa';
import '../styles/ProductDetails.css'; 

// Components
import ProductReviews from '../components/products/ProductReviews';
import RelatedProducts from '../components/products/RelatedProducts';
import Loader from '../components/common/Loader';

const ProductDetails = () => {
  const { id } = useParams(); 
  const { addToCart } = useCart();
  const toast = useToast();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImage, setActiveImage] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "products_collection", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({ id: docSnap.id, ...data });

          if (data.images && data.images.length > 0) setActiveImage(data.images[0]);
          else setActiveImage(data.image_url);

          if (data.variants && data.variants.length > 0) {
            setSelectedVariant(data.variants[0]);
          } else {
            setSelectedVariant({
              unit: 'Standard',
              price: data.price,
              stock: data.stock_quantity,
              discount: 0
            });
          }
        }
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    if (id) fetchProduct();
  }, [id]);

  // Recents Logic
  useEffect(() => {
    if (!id) return;
    let viewed = JSON.parse(localStorage.getItem('nk_recently_viewed') || '[]');
    viewed = viewed.filter(item => item !== id);
    viewed.unshift(id);
    if (viewed.length > 10) viewed.pop();
    localStorage.setItem('nk_recently_viewed', JSON.stringify(viewed));
  }, [id]);

  const handleVariantSelect = (e) => {
    if (!product?.variants) return;
    const v = product.variants.find(item => item.unit === e.target.value);
    setSelectedVariant(v);
  };

  const handleAddToCart = () => {
    if (product && selectedVariant) {
      const rawPrice = Number(selectedVariant.price);
      const discount = Number(selectedVariant.discount || 0);
      const effectivePrice = Math.round(rawPrice - (rawPrice * discount / 100));

      const cartItem = {
        ...product,
        id: `${product.id}-${selectedVariant.unit}`,
        realId: product.id, 
        name: `${product.name} (${selectedVariant.unit})`, 
        price: effectivePrice, 
        originalPrice: rawPrice,
        stock: selectedVariant.stock, 
        unit: selectedVariant.unit,
        // Save the image currently viewed for consistency
        image_url: activeImage || product.image_url 
      };
      
      addToCart(cartItem);
      toast.success(`Added ${product.name} to cart`);
    }
  };

  const originalPrice = selectedVariant ? Number(selectedVariant.price) : 0;
  const discountPct = selectedVariant ? Number(selectedVariant.discount || 0) : 0;
  const currentPrice = Math.round(originalPrice - (originalPrice * discountPct / 100));
  const currentStock = selectedVariant ? selectedVariant.stock : 0;

  if (loading) return <Loader text="Loading product..." />;
  if (!product) return <div style={{padding:'50px', textAlign:'center'}}>Product Not Found</div>;

  return (
    <div className="container">
      <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:'5px', color:'var(--text-light)', marginBottom:'20px', textDecoration:'none', fontWeight: '600' }}>
        <FaArrowLeft /> Back to Shop
      </Link>
      
      {/* 1. LAYOUT CONTAINER (Uses the new CSS grid) */}
      <div className="details-container">
        
        {/* --- LEFT: IMAGES --- */}
        <div className="details-image-section">
          {/* Main Image Box */}
          <div className="main-image-wrapper">
             <img 
               src={activeImage || "https://via.placeholder.com/300x300?text=No+Image"} 
               alt={product.name} 
               className="main-img"
               onError={(e) => { e.target.src="https://via.placeholder.com/300x300?text=No+Image"; }}
             />
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="thumbnails-strip">
               {product.images.map((img, idx) => (
                 <div 
                   key={idx} 
                   className={`thumb-box ${activeImage === img ? 'active' : ''}`}
                   onClick={() => setActiveImage(img)}
                 >
                    <img src={img} alt="thumb" className="thumb-img"/>
                 </div>
               ))}
            </div>
          )}
        </div>

        {/* --- RIGHT: INFORMATION --- */}
        <div className="details-info-section">
          <div className="category-tag">{product.category || 'General'}</div>
          <h1 className="product-title">{product.name}</h1>
          
          {/* Prices */}
          <div className="price-area">
             {discountPct > 0 && (
               <div className="old-price-row">
                  <span className="strikethrough">₹{originalPrice}</span>
                  <span className="discount-badge">{discountPct}% OFF</span>
               </div>
             )}
             <div className="current-price" style={{ color: discountPct > 0 ? '#ef4444' : 'var(--primary-color)' }}>
               ₹{currentPrice}
             </div>
          </div>
          
          {/* Select Variant */}
          {product.variants && product.variants.length > 0 && (
             <div className="variant-selector">
               <label className="variant-label">Select Size / Unit:</label>
               <select 
                 className="variant-dropdown"
                 onChange={handleVariantSelect} 
                 value={selectedVariant?.unit}
               >
                 {product.variants.map((v, i) => {
                   const effective = Math.round(v.price - (v.price * (v.discount || 0) / 100));
                   return (
                     <option key={i} value={v.unit} disabled={v.stock <= 0}>
                       {v.unit} - ₹{effective} {v.stock <= 0 ? '(Sold Out)' : ''}
                     </option>
                   );
                 })}
               </select>
             </div>
          )}

          {/* Description */}
          <p className="product-desc">
            {product.description || 'No detailed description available.'}
          </p>
          
          {/* Stock Check */}
          <div className="stock-status">
            {currentStock > 0 ? (
               <span style={{ color: '#16a34a' }}><FaCheck /> In Stock ({currentStock} available)</span>
            ) : (
               <span style={{ color: '#dc2626' }}>Out of Stock</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="details-actions">
            <button className="btn" onClick={handleAddToCart} disabled={currentStock <= 0}>
              <FaShoppingCart style={{ marginRight:'8px'}} /> {currentStock <= 0 ? 'Unavailable' : 'Add to Cart'}
            </button>
            <Link to="/cart" className="btn secondary">Go to Cart</Link>
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} />
      <RelatedProducts currentCategory={product.category} currentId={product.id} />
    </div>
  );
};

export default ProductDetails;