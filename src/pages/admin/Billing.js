import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { FaSearch, FaTrash, FaPlus, FaMinus, FaPrint, FaCalculator, FaTimes, FaList, FaShoppingCart } from 'react-icons/fa';
import '../../styles/Billing.css';
import '../../styles/Form.css';

const Billing = () => {
  const navigate = useNavigate();
  
  // Data State
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection Logic
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [tempProduct, setTempProduct] = useState(null);
  
  // Order Info
  const [customerName, setCustomerName] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [loading, setLoading] = useState(false);

  // MOBILE TAB STATE
  const [mobileTab, setMobileTab] = useState('catalog');

  // Fetch Data
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, "products_collection"));
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(list);
      } catch (err) { console.error(err); }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- ADD TO CART HANDLERS ---

  const handleProductClick = (product) => {
    // Check if variant exists
    if (product.variants && product.variants.length > 1) {
      setTempProduct(product);
      setShowVariantModal(true);
    } 
    // Auto-select single variant
    else if (product.variants && product.variants.length === 1) {
      addItemToCart(product, product.variants[0]);
    } 
    // Legacy / No variant
    else {
      addItemToCart(product, null); 
    }
  };

  const handleSelectVariant = (variant) => {
    if (!tempProduct) return;
    addItemToCart(tempProduct, variant);
    setShowVariantModal(false);
    setTempProduct(null);
  };

  const addItemToCart = (product, selectedVariant) => {
    const variantIdSuffix = selectedVariant ? `-${selectedVariant.unit}` : '';
    const cartId = product.id + variantIdSuffix;

    const unit = selectedVariant ? selectedVariant.unit : product.unit || 'Std';
    const price = selectedVariant ? Number(selectedVariant.price) : Number(product.price);
    const stock = selectedVariant ? Number(selectedVariant.stock) : Number(product.stock_quantity);
    const discount = selectedVariant ? Number(selectedVariant.discount || 0) : 0;
    
    // Auto-Apply Internal Discount
    const finalPrice = Math.round(price - (price * discount / 100));

    if (stock <= 0) return alert(`Out of Stock!`);

    const existing = cart.find(c => c.cartId === cartId);
    if (existing) {
      if (existing.quantity >= stock) return alert(`Stock Limit Reached`);
      setCart(cart.map(item => item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, cartId, unit, price: finalPrice, quantity: 1 }]);
    }
  };

  const updateQty = (cartId, change) => {
    setCart(prev => prev.map(item => {
        if (item.cartId === cartId) {
            const newQty = item.quantity + change;
            if (newQty < 1) return null; 
            return { ...item, quantity: newQty };
        }
        return item;
    }).filter(Boolean));
  };

  const removeFromBill = (cartId) => setCart(cart.filter(c => c.cartId !== cartId));

  const subTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subTotal; 

  const handlePrintBill = async () => {
    if (cart.length === 0) return alert("Cart is empty");
    setLoading(true);
    try {
      const orderPayload = {
        user_id: 'admin_pos',
        shipping_details: {
            fullName: customerName || 'Walk-in',
            houseNo: 'Counter', roadName: 'POS Sale', city: '-', pincode: '', label: 'POS'
        },
        user_phone: 'N/A', user_email: '',
        items: cart, 
        total_amount: total,
        status: 'Delivered',
        payment_mode: paymentMode,
        date: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "orders_collection"), orderPayload);

      cart.forEach(async (item) => {
         try {
            await updateDoc(doc(db, "products_collection", item.realId || item.id), {
                stock_quantity: increment(-item.quantity),
                sold_count: increment(item.quantity)
            });
         } catch(e){}
      });

      navigate(`/print-receipt/${docRef.id}`);
    } catch (error) { alert("Error"); } 
    finally { setLoading(false); }
  };

  return (
    // FIX: Removed inline overflow style from here. 
    // Uses standard 'admin-container' layout now so sidebar is unaffected.
    <div className="admin-container">
      <AdminSidebar />
      
      {/* 
          Apply specific sizing styles to the CONTENT area only. 
          This keeps the Billing tool 'App-Like' (no window scroll) 
          without breaking the Sidebar scrolling.
      */}
      <main className="admin-content" style={{ height: '100vh', display:'flex', flexDirection:'column', overflow: 'hidden' }}>
        
        {/* MOBILE TABS SWITCHER */}
        <div className="mobile-tabs">
            <button className={`tab-btn ${mobileTab === 'catalog' ? 'active' : ''}`} onClick={() => setMobileTab('catalog')}>
                <FaList style={{marginRight:'5px'}}/> Products
            </button>
            <button className={`tab-btn ${mobileTab === 'bill' ? 'active' : ''}`} onClick={() => setMobileTab('bill')}>
                <FaShoppingCart style={{marginRight:'5px'}}/> Bill ({cart.length})
            </button>
        </div>

        <div className="billing-wrapper">
            {/* LEFT: CATALOG */}
            <div className="billing-catalog" style={{ display: (window.innerWidth <= 900 && mobileTab !== 'catalog') ? 'none' : 'flex' }}>
                <div className="billing-search">
                    <FaSearch style={{color:'#94a3b8', marginRight:'10px'}}/>
                    <input 
                       autoFocus
                       placeholder="Scan / Search..."
                       style={{border:'none', outline:'none', width:'100%', fontSize:'1rem'}}
                       value={searchTerm}
                       onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="catalog-grid">
                    {filteredProducts.map(prod => (
                        <div key={prod.id} className="pos-product-card" onClick={() => handleProductClick(prod)}>
                            <img src={prod.image_url || "https://via.placeholder.com/80"} alt="" className="pos-img" />
                            <div className="pos-title">{prod.name}</div>
                            
                            {prod.variants && prod.variants.length > 1 ? (
                               <div style={{fontSize:'0.65rem', color:'var(--primary-color)', background:'#eff6ff', borderRadius:'4px', marginTop:'auto', padding:'4px'}}>
                                  {prod.variants.length} Sizes
                               </div>
                            ) : (
                                <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', marginTop:'auto'}}>
                                    <span className="pos-price">₹{prod.variants && prod.variants[0] ? prod.variants[0].price : prod.price}</span>
                                    <span style={{color: prod.stock_quantity < 5 ? 'red':'green'}}>Stock: {prod.stock_quantity}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: BILL */}
            <div className="billing-cart" style={{ display: (window.innerWidth <= 900 && mobileTab !== 'bill') ? 'none' : 'flex' }}>
                <div className="cart-header">
                    <h3 style={{margin:0, fontSize:'1.1rem'}}><FaCalculator/> New Bill</h3>
                </div>

                <div className="cart-body">
                    {cart.length === 0 ? <div style={{textAlign:'center', marginTop:'50px', color:'#ccc'}}>Cart Empty</div> : (
                        cart.map(item => (
                            <div key={item.cartId} className="bill-item">
                                <div className="bill-item-info">
                                    <div style={{fontWeight:'600', fontSize:'0.9rem'}}>
                                        {item.name}
                                        {item.unit && item.unit !== 'Std' && <span style={{fontSize:'0.8rem', color:'#666', marginLeft:'5px', background:'#f1f5f9', padding:'2px 4px', borderRadius:'4px'}}>{item.unit}</span>}
                                    </div>
                                    <small style={{color:'#666'}}>₹{item.price}</small>
                                </div>
                                <div className="bill-qty">
                                    <FaMinus size={10} style={{cursor:'pointer'}} onClick={() => updateQty(item.cartId, -1)} />
                                    <span>{item.quantity}</span>
                                    <FaPlus size={10} style={{cursor:'pointer'}} onClick={() => updateQty(item.cartId, 1)} />
                                </div>
                                <div className="bill-total">₹{item.price * item.quantity}</div>
                                <FaTrash size={12} color="#ef4444" style={{cursor:'pointer'}} onClick={() => removeFromBill(item.cartId)}/>
                            </div>
                        ))
                    )}
                </div>

                <div className="bill-footer">
                    <div className="calc-row"><span>Items: {cart.length}</span></div>
                    <div className="grand-total" style={{fontSize:'1.2rem', margin:'10px 0'}}><span>Pay:</span><span>₹{total}</span></div>
                    
                    <div style={{display:'flex', gap:'5px', marginBottom:'10px'}}>
                         <input className="form-input" placeholder="Customer Name" style={{margin:0}} value={customerName} onChange={e=>setCustomerName(e.target.value)}/>
                         <select className="form-select" style={{margin:0, width:'80px'}} value={paymentMode} onChange={e=>setPaymentMode(e.target.value)}>
                            <option>Cash</option><option>UPI</option>
                         </select>
                    </div>
                    <button className="btn" style={{width:'100%', height:'45px'}} onClick={handlePrintBill} disabled={loading}>
                        {loading ? '...' : <><FaPrint/> PRINT</>}
                    </button>
                </div>
            </div>
        </div>

        {/* Modal Logic */}
        {showVariantModal && tempProduct && (
            <div className="billing-modal-overlay">
                <div className="billing-modal-content">
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <h3 style={{margin:0, fontSize:'1.1rem'}}>Select Size</h3>
                        <FaTimes style={{cursor:'pointer', fontSize:'1.1rem'}} onClick={() => setShowVariantModal(false)}/>
                    </div>
                    
                    <div style={{textAlign:'center', margin:'15px 0', paddingBottom:'15px', borderBottom:'1px dashed #e2e8f0'}}>
                        <img 
                          src={tempProduct.image_url || 'https://via.placeholder.com/100'} 
                          alt={tempProduct.name}
                          style={{ width:'80px', height:'80px', objectFit:'contain', borderRadius:'8px', border:'1px solid #eee' }} 
                        />
                        <div style={{ fontWeight:'600', color:'#1f2937', marginTop:'8px' }}>{tempProduct.name}</div>
                    </div>
                    
                    <div className="variant-grid">
                        {tempProduct.variants.map((v, i) => (
                            <button key={i} className="variant-btn" disabled={Number(v.stock) <= 0} onClick={() => handleSelectVariant(v)}>
                                <div className="v-size">{v.unit}</div>
                                <div className="v-price">
                                  ₹{Math.round(v.price - (v.price * (v.discount||0) / 100))}
                                </div>
                                <small style={{color: v.stock>0 ? 'green':'red'}}>{v.stock > 0 ? 'Available' : 'Out of Stock'}</small>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default Billing;