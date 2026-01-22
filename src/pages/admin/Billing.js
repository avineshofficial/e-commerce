import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { FaSearch, FaTrash, FaPlus, FaMinus, FaPrint, FaCalculator, FaTimes, FaEye, FaReceipt } from 'react-icons/fa';
import '../../styles/Billing.css';
import '../../styles/Form.css';

const Billing = () => {
  const navigate = useNavigate();
  
  // -- Data --
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // -- Bill Settings (Advanced Features) --
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState(''); // New: Basic history link
  const [paymentMode, setPaymentMode] = useState('Cash'); // Cash, UPI, Card
  const [discountVal, setDiscountVal] = useState(0);      // Amount
  const [discountType, setDiscountType] = useState('%');  // % or Flat ₹ (for now simplified to %)
  const [gstRate, setGstRate] = useState(0);              // 0, 5, 12, 18
  const [showPreview, setShowPreview] = useState(false);  // Modal Toggle

  // -- Variation Selection --
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [tempProduct, setTempProduct] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, "products_collection"));
        setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) { console.error(err); }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- ADD / UPDATE CART LOGIC ---

  const handleProductClick = (product) => {
    if (product.variants && product.variants.length > 1) {
      setTempProduct(product);
      setShowVariantModal(true);
    } else {
      addItemToCart(product, product.variants ? product.variants[0] : null); 
    }
  };

  const handleSelectVariant = (variant) => {
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

    // Calculate effective price if a default discount exists on product
    const prodDiscount = selectedVariant ? Number(selectedVariant.discount || 0) : 0;
    const finalPrice = Math.round(price - (price * prodDiscount / 100));

    if (stock <= 0) return alert(`Out of Stock!`);

    const existing = cart.find(c => c.cartId === cartId);
    if (existing) {
       if (existing.quantity >= stock) return alert("Stock Limit Reached");
       setCart(cart.map(i => i.cartId === cartId ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
       setCart([...cart, {
         ...product, cartId, realId: product.id,
         unit, price: finalPrice, originalPrice: price, quantity: 1
       }]);
    }
  };

  const updateQty = (cartId, change) => {
    setCart(prev => prev.map(item => {
        if (item.cartId === cartId) {
            const newQty = Math.max(0, item.quantity + change);
            return newQty === 0 ? null : { ...item, quantity: newQty };
        }
        return item;
    }).filter(Boolean));
  };

  // --- TOTAL CALCULATIONS ---
  const subTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // 1. Discount Calc
  const discountAmt = Math.round( (subTotal * discountVal) / 100 ); // Assumes % logic
  
  // 2. Taxable Value
  const taxableValue = subTotal - discountAmt;

  // 3. GST Calc
  const taxAmt = Math.round((taxableValue * gstRate) / 100);

  // 4. Grand Total
  const grandTotal = taxableValue + taxAmt;

  // --- FINAL CHECKOUT ---
  const processOrder = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
        const orderPayload = {
            user_id: 'admin_pos',
            shipping_details: {
                fullName: customerName || 'Walk-in',
                houseNo: 'Counter Sale', roadName: '', city: 'Madurai', pincode: '', label: 'POS'
            },
            user_phone: customerPhone || 'N/A',
            user_email: '',
            items: cart,
            // Saving Financial Breakdown
            subtotal: subTotal,
            discount_details: { code: 'MANUAL', percent: discountVal, amount: discountAmt },
            shipping_cost: 0,
            tax_amount: taxAmt, // NEW: Tax saving
            total_amount: grandTotal,
            
            status: 'Delivered',
            payment_mode: paymentMode,
            date: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, "orders_collection"), orderPayload);

        // Update Inventory
        cart.forEach(async (item) => {
           try {
              const prodRef = doc(db, "products_collection", item.realId || item.id);
              await updateDoc(prodRef, {
                  stock_quantity: increment(-item.quantity),
                  sold_count: increment(item.quantity)
              });
           } catch(e) {}
        });

        // Redirect
        navigate(`/print-receipt/${docRef.id}`);

    } catch (e) {
        alert("Billing Failed");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="admin-container" style={{overflow:'hidden', height:'100vh'}}>
      <AdminSidebar />
      
      <main className="admin-content" style={{ padding: '20px', height: '100%', overflow: 'hidden' }}>
        
        <div className="billing-wrapper">
            
            {/* 1. CATALOG */}
            <div className="billing-catalog">
                <div className="billing-search">
                    <FaSearch style={{color:'#94a3b8'}}/>
                    <input autoFocus placeholder="Scan / Search Product..." 
                        value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
                </div>
                <div className="catalog-grid">
                    {filteredProducts.map(prod => (
                        <div key={prod.id} className="pos-product-card" onClick={() => handleProductClick(prod)}>
                            <img src={prod.image_url} className="pos-img" alt=""/>
                            <div className="pos-meta">
                                <h4>{prod.name}</h4>
                                <div className="pos-price-stock">
                                    <span style={{fontWeight:'bold'}}>₹{prod.variants ? prod.variants[0]?.price : prod.price}</span>
                                    <span className={`stock-tag ${prod.stock_quantity < 5 ? 'low' : ''}`}>
                                        Stk: {prod.stock_quantity}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. CART / BILL */}
            <div className="billing-cart">
                <div className="cart-header">
                    <h3><FaCalculator /> New Bill</h3>
                    <div style={{fontSize:'0.85rem', fontWeight:'normal'}}>{new Date().toLocaleDateString()}</div>
                </div>

                <div className="cart-body">
                   {cart.length===0 ? <div style={{padding:'40px',textAlign:'center', color:'#cbd5e1'}}>Cart Empty</div> : 
                      cart.map(item => (
                        <div key={item.cartId} className="bill-item">
                           <div style={{minWidth:0}}>
                              <div className="b-name">{item.name}</div>
                              <div className="b-unit">{item.unit !== 'Std' ? item.unit : ''} @ ₹{item.price}</div>
                           </div>
                           <div className="qty-group">
                              <div className="qty-btn" onClick={() => updateQty(item.cartId, -1)}><FaMinus size={8}/></div>
                              <div className="qty-val">{item.quantity}</div>
                              <div className="qty-btn" onClick={() => updateQty(item.cartId, 1)}><FaPlus size={8}/></div>
                           </div>
                           <div className="b-total">₹{item.price*item.quantity}</div>
                           <FaTimes style={{color:'#ef4444', cursor:'pointer'}} onClick={() => updateQty(item.cartId, -item.quantity)} />
                        </div>
                      ))
                   }
                </div>

                {/* 3. CALCULATION & PAYMENT */}
                <div className="cart-footer">
                    {/* Top Row: Customer Info */}
                    <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
                        <input className="form-input" style={{margin:0}} placeholder="Customer Name" value={customerName} onChange={e=>setCustomerName(e.target.value)} />
                        <input className="form-input" style={{margin:0, width:'120px'}} placeholder="Phone" value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} />
                    </div>

                    {/* Middle: Discount/Tax Controls */}
                    <div className="modifiers-section">
                        
                        {/* Discount */}
                        <div className="mod-row">
                           <span className="mod-label">Discount (%)</span>
                           <div className="disc-input-group">
                              <div className="disc-prefix">%</div>
                              <input type="number" value={discountVal} onChange={e=>setDiscountVal(Number(e.target.value))} />
                           </div>
                        </div>

                        {/* GST / Tax Toggle */}
                        <div className="mod-row">
                           <span className="mod-label">GST Tax</span>
                           <div className="gst-pills">
                              {[0, 5, 12, 18].map(rate => (
                                 <button key={rate} 
                                    className={`gst-btn ${gstRate === rate ? 'active' : ''}`}
                                    onClick={() => setGstRate(rate)}
                                 >
                                    {rate === 0 ? 'None' : `${rate}%`}
                                 </button>
                              ))}
                           </div>
                        </div>

                        {/* Payment Mode */}
                        <div className="pay-toggle">
                           {['Cash', 'UPI', 'Card'].map(m => (
                               <div key={m} className={`pay-opt ${paymentMode === m ? 'active' : ''}`} onClick={()=>setPaymentMode(m)}>
                                  {m}
                               </div>
                           ))}
                        </div>
                    </div>

                    {/* Bottom: Totals */}
                    <div>
                       <div className="summary-line"><span>Subtotal</span><span>₹{subTotal}</span></div>
                       {discountAmt > 0 && <div className="summary-line" style={{color:'#10b981'}}><span>Discount</span><span>- ₹{discountAmt}</span></div>}
                       {taxAmt > 0 && <div className="summary-line"><span>Tax (GST {gstRate}%)</span><span>+ ₹{taxAmt}</span></div>}
                       
                       <div className="summary-line bold">
                           <span>To Pay:</span><span>₹{grandTotal}</span>
                       </div>
                    </div>

                    {/* Buttons */}
                    <div className="action-buttons">
                       <button className="btn secondary" onClick={()=>setShowPreview(true)} disabled={cart.length===0} style={{justifyContent:'center'}}>
                          <FaEye /> Preview
                       </button>
                       <button className="btn" onClick={processOrder} disabled={loading || cart.length===0} style={{justifyContent:'center'}}>
                          {loading ? '...' : <><FaPrint/> PRINT</>}
                       </button>
                    </div>

                </div>
            </div>
        </div>

        {/* --- SIZE SELECTOR MODAL --- */}
        {showVariantModal && tempProduct && (
            <div className="billing-modal-overlay">
                <div className="billing-modal-content">
                    <div style={{display:'flex', justifyContent:'space-between', margin:'0 0 15px 0'}}>
                        <h4 style={{margin:0}}>Select Size</h4> <FaTimes style={{cursor:'pointer'}} onClick={()=>setShowVariantModal(false)}/>
                    </div>
                    <div className="variant-grid">
                        {tempProduct.variants.map((v, i) => (
                           <div key={i} className="variant-btn" onClick={()=>handleSelectVariant(v)}>
                               <div className="v-size">{v.unit}</div>
                               <div className="v-price">₹{Math.round(v.price - (v.price*(v.discount||0)/100))}</div>
                           </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* --- BILL PREVIEW MODAL --- */}
        {showPreview && (
          <div className="preview-modal-overlay">
            <div className="preview-content">
               <div className="preview-body">
                   <div className="rec-header">
                       <h3>BILL PREVIEW</h3>
                       <p>{new Date().toLocaleString()}</p>
                   </div>
                   <div>Customer: {customerName || 'N/A'}</div>
                   <div style={{margin:'10px 0', borderTop:'1px dashed #000'}}></div>
                   <table className="rec-table">
                       <tbody>
                           {cart.map((item, i) => (
                               <tr key={i}>
                                   <td>{item.name} <br/><small>{item.unit}</small></td>
                                   <td style={{textAlign:'right'}}>{item.quantity} x {item.price} = {item.price * item.quantity}</td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
                   <div className="rec-total">
                       <div>Subtotal: ₹{subTotal}</div>
                       <div>Disc: -₹{discountAmt}</div>
                       <div>Tax: +₹{taxAmt}</div>
                       <div style={{fontSize:'18px', marginTop:'5px'}}>Total: ₹{grandTotal}</div>
                   </div>
               </div>
               <div className="preview-footer">
                  <button className="btn secondary" style={{color:'#fff', border:'1px solid #ffffff50'}} onClick={()=>setShowPreview(false)}>Edit</button>
                  <button className="btn" style={{background:'#10b981', color:'white'}} onClick={processOrder}>Confirm & Print</button>
               </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Billing;