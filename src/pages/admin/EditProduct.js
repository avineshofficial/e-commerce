import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { FaEdit, FaSave, FaArrowLeft, FaTrash, FaPlus } from 'react-icons/fa';
import { useToast } from '../../context/ToastContext';
import '../../styles/Form.css';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);

  // Basic Info
  const [product, setProduct] = useState({
    name: '',
    category: '',
    description: '',
    image_url: '',
    featured: false
  });

  // Variants State
  const [variants, setVariants] = useState([]);

  // 1. Fetch Data (Product + Categories)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Categories
        const catSnap = await getDocs(collection(db, "categories"));
        const catList = catSnap.docs.map(d => d.data());
        if (catList.length > 0) setCategories(catList);

        // Fetch Product
        const docRef = doc(db, "products_collection", id);
        const snapshot = await getDoc(docRef);
        
        if (snapshot.exists()) {
          const data = snapshot.data();
          setProduct({
            name: data.name || '',
            category: data.category || '',
            description: data.description || '',
            image_url: data.image_url || '',
            featured: data.featured || false
          });

          // Handle Variants (Legacy support)
          if (data.variants && data.variants.length > 0) {
            setVariants(data.variants);
          } else {
            // Convert old single-unit product to variant structure for editing
            setVariants([{
    unit: 'Standard',
    price: data.price || 0,
    discount: data.discount || 0, // ensure we capture this if legacy updated
    stock: data.stock_quantity || 0
  }]);
          }
        } else {
          toast.error("Product not found!");
          navigate('/admin/inventory');
        }
      } catch (error) {
        console.error(error);
        toast.error("Error loading data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate, toast]);

  // --- HANDLERS ---

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const addVariant = () => {
    setVariants([...variants, { unit: '', price: '', stock: '' }]);
  };

  const removeVariant = (index) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    } else {
      toast.warning("Cannot remove the last option. A product must have at least one price.");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
        // Validation
        const isValid = variants.every(v => v.unit && v.price !== '' && v.stock !== '');
        if (!isValid || !product.name) {
            toast.error("Please fill all required fields");
            setSaving(false);
            return;
        }

        // Logic: Main price display is the lowest variant price
        const prices = variants.map(v => Number(v.price));
        const minPrice = Math.min(...prices);
        
        // Logic: Total Stock is sum of all variants
        const totalStock = variants.reduce((sum, v) => sum + Number(v.stock), 0);

        // Sanitize variants data
        const finalVariants = variants.map(v => ({
      unit: v.unit,
      price: Number(v.price),
      discount: Number(v.discount || 0), // Save Discount
      stock: Number(v.stock)
  }));

        const docRef = doc(db, "products_collection", id);
        
        await updateDoc(docRef, {
            ...product,
            variants: finalVariants,
            price: minPrice,         
            stock_quantity: totalStock,
            // Keep existing stats safe
        });

        toast.success("Product Updated Successfully!");
        navigate('/admin/inventory');
      
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{padding:'50px', textAlign:'center'}}>Loading Editor...</div>;

  return (
    <div className="form-container" style={{ maxWidth: '800px' }}>
      <button 
        onClick={() => navigate('/admin/inventory')}
        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}
      >
        <FaArrowLeft /> Cancel
      </button>

      <div className="form-header">
        <FaEdit size={24} />
        <h2 style={{ margin: 0 }}>Edit Product</h2>
      </div>

      <form onSubmit={handleUpdate}>
        
        {/* --- MAIN INFO --- */}
        <div className="form-group">
          <label>Product Name</label>
          <input 
            type="text" name="name" className="form-input" required 
            value={product.name} onChange={handleChange} 
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <select 
            name="category" className="form-select" required 
            value={product.category} onChange={handleChange}
          >
            <option value="">Select Category</option>
            {categories.length > 0 ? (
                categories.filter(c => c.isActive !== false).map((cat, i) => (
                    <option key={i} value={cat.value}>{cat.name}</option>
                ))
            ) : (
                <option value={product.category}>{product.category} (Legacy)</option>
            )}
          </select>
        </div>

        {/* --- VARIANTS MANAGER --- */}
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', margin: '20px 0' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#334155' }}>Pricing & Stock Variants</h4>
            
            {variants.map((variant, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '15px' }}>
                    <div style={{ flex: 1.5 }}>
                        <label style={{ fontSize:'0.75rem', marginBottom:'4px' }}>Size/Unit</label>
                        <input 
                            className="form-input" 
                            style={{ margin: 0 }}
                            value={variant.unit} 
                            onChange={(e) => handleVariantChange(index, 'unit', e.target.value)}
                            placeholder="e.g. 1kg"
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize:'0.75rem', marginBottom:'4px' }}>Price (₹)</label>
                        <input 
                            type="number" className="form-input" style={{ margin: 0 }}
                            value={variant.price} 
                            onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize:'0.75rem', marginBottom:'4px' }}>Stock</label>
                        <input 
                            type="number" className="form-input" style={{ margin: 0 }}
                            value={variant.stock} 
                            onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                        />
                    </div>

                    <div style={{ flex: 1.5 }}>
      <label style={{ fontSize:'0.75rem', marginBottom:'4px' }}>Disc %</label>
      <input 
          type="number" className="form-input" style={{ margin: 0 }}
          value={variant.discount || 0} // Default 0 if missing
          onChange={(e) => handleVariantChange(index, 'discount', e.target.value)}
      />
  </div>
                    <div style={{ paddingBottom:'5px' }}>
                       {variants.length > 1 && (
                           <button type="button" onClick={() => removeVariant(index)} style={{ border:'none', background:'#fee2e2', color:'#ef4444', padding:'10px', borderRadius:'4px', cursor:'pointer' }}>
                               <FaTrash />
                           </button>
                       )}
                    </div>
                </div>
            ))}

            <button type="button" onClick={addVariant} className="btn-outline" style={{ marginTop: '5px', fontSize:'0.85rem' }}>
                <FaPlus size={10} style={{ marginRight:'6px' }} /> Add Size
            </button>
        </div>

        {/* --- REST --- */}
        <div className="form-group">
          <label>Image URL</label>
          <input 
            type="text" name="image_url" className="form-input" required 
            value={product.image_url} onChange={handleChange} 
          />
          {product.image_url && (
            <img src={product.image_url} alt="Preview" style={{ height: '60px', marginTop:'10px', borderRadius:'4px', border:'1px solid #ddd' }} onError={(e)=>e.target.style.display='none'}/>
          )}
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea 
            name="description" className="form-textarea" rows="4" 
            value={product.description} onChange={handleChange} 
          />
        </div>

        <label className="checkbox-group">
          <input 
            type="checkbox" name="featured" 
            checked={product.featured} onChange={handleChange} 
          />
          <span style={{ fontWeight: 600 }}>Mark as Featured (Home Banner)</span>
        </label>

        <button 
          type="submit" 
          className="btn" 
          disabled={saving}
          style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', marginTop: '15px' }}
        >
          {saving ? 'Saving...' : <><FaSave style={{marginRight:'6px'}}/> Save Changes</>}
        </button>
      </form>
    </div>
  );
};

export default EditProduct;