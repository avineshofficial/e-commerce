import React from 'react';
import { useCart } from '../../context/CartContext';
import { FaTrash, FaMinus, FaPlus, FaArrowLeft, FaShoppingBag } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Cart.css';

// Placeholder image
const PLACEHOLDER_IMG = "https://via.placeholder.com/150?text=No+Image";

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, totalAmount, cartSubtotal, shippingCost } = useCart();
  const navigate = useNavigate();

  const handleImageError = (e) => {
    e.target.src = PLACEHOLDER_IMG;
  };

  if (cartItems.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '80px', padding:'20px' }}>
        <FaShoppingBag size={60} style={{ color: '#e2e8f0', marginBottom:'20px' }} />
        <h2 style={{color: '#334155'}}>Your Cart is Empty</h2>
        <p style={{ color: '#94a3b8', marginBottom: '25px' }}>Looks like you haven't added anything yet.</p>
        <Link to="/" className="btn">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <h2 className="cart-title">
        Shopping Cart <span className="cart-count">({cartItems.length} items)</span>
      </h2>
      
      <div className="cart-page-grid">
        
        {/* --- LEFT: ITEMS LIST --- */}
        <div className="cart-items-list">
          {/* Header Row (Desktop Only) */}
          <div className="cart-header-row">
            <span style={{flex: 2}}>PRODUCT DETAILS</span>
            <span style={{flex: 1, textAlign: 'center'}}>QUANTITY</span>
            <span style={{flex: 1, textAlign: 'right'}}>TOTAL</span>
            <span style={{width: '30px'}}></span> 
          </div>

          {cartItems.map((item) => (
              <div key={item.id} className="cart-item-card">
                
                {/* 1. Image & Info */}
                <div className="cart-item-main">
                  <Link to={`/product/${item.realId || item.id}`} className="cart-img-wrapper">
                    <img 
                      src={item.image_url || PLACEHOLDER_IMG} 
                      alt={item.name} 
                      onError={handleImageError}
                      className="cart-item-image"
                    />
                  </Link>
                  
                  <div className="cart-item-details">
                    <Link to={`/product/${item.realId || item.id}`} className="item-name-link">
                      <h4 className="item-name">{item.name.replace(/\(.*\)/, '').trim()}</h4>
                    </Link>
                    
                    <div className="item-variant-info">
                      {item.unit && <span className="variant-badge">{item.unit}</span>}
                      <span className="single-price">@ ₹{item.price}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Quantity */}
                <div className="cart-item-actions">
                  <div className="qty-control">
                    <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                        disabled={item.quantity <= 1}
                    >
                      <FaMinus size={10} />
                    </button>
                    
                    <span>{item.quantity}</span>
                    
                    {/* --- FIX: DISABLE BUTTON IF STOCK REACHED --- */}
                    <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= (item.stock || item.stock_quantity)}
                        style={{ 
                            opacity: item.quantity >= (item.stock || item.stock_quantity) ? 0.3 : 1,
                            cursor: item.quantity >= (item.stock || item.stock_quantity) ? 'not-allowed' : 'pointer'
                        }}
                    >
                      <FaPlus size={10} />
                    </button>

                  </div>
                  {/* Show "Max Reached" text for clarity */}
                  {item.quantity >= (item.stock || item.stock_quantity) && (
                      <div style={{fontSize:'0.65rem', color:'#ef4444', marginTop:'5px', fontWeight:'600'}}>
                        Max limit reached
                      </div>
                  )}
                </div>

                {/* 3. Total */}
                <div className="cart-item-total">
                  ₹{item.price * item.quantity}
                </div>

                {/* 4. Remove */}
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="remove-btn-icon"
                  title="Remove Item"
                >
                  <FaTrash />
                </button>

              </div>
            ))}
        </div>

        {/* --- RIGHT: ORDER SUMMARY --- */}
        <div className="cart-summary-box">
           <h3 className="cart-summary-header">Order Summary</h3>
           
           <div className="cart-summary-content">
             <div className="cart-summary-row">
               <span>Subtotal</span>
               <span className="cart-summary-value">₹{cartSubtotal}</span>
             </div>
             
             <div className="cart-summary-row">
               <span>Shipping</span>
               <span style={{ color: shippingCost === 0 ? '#16a34a' : '#334155', fontWeight: shippingCost === 0 ? '600':'400' }}>
                 {shippingCost === 0 ? 'Free' : `+ ₹${shippingCost}`}
               </span>
             </div>

             {shippingCost > 0 && (
                <div style={{fontSize:'0.75rem', color:'#9ca3b8', marginBottom:'5px', marginTop:'-10px'}}>
                   Add ₹{499 - cartSubtotal} more for free shipping
                </div>
             )}
             
             {/* Divider */}
             <div className="cart-summary-divider"></div>

             <div className="cart-summary-total">
               <span>Total</span>
               <span>₹{totalAmount}</span>
             </div>
             
             <button 
               className="btn" 
               style={{ width: '100%', justifyContent:'center', padding:'14px', fontSize:'1.05rem', marginTop:'10px' }}
               onClick={() => navigate('/checkout')}
             >
               Proceed to Checkout
             </button>
             
             <Link to="/" className="back-shopping-link">
               <FaArrowLeft style={{ fontSize: '0.8rem' }}/> Continue Shopping
             </Link>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Cart;