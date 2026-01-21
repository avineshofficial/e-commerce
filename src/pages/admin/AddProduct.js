import React, { useState, useEffect } from 'react';
import { db, storage } from '../../config/firebase'; // Added storage
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Storage methods
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSave, FaArrowLeft, FaTrash, FaImages, FaCloudUploadAlt } from 'react-icons/fa';
import { useToast } from '../../context/ToastContext';
import '../../styles/Form.css'; 

const AddProduct = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Image States
  const [imageFiles, setImageFiles] = useState([]); // Stores raw files
  const [previews, setPreviews] = useState([]);     // Stores local preview URLs
  const [uploading, setUploading] = useState(false);

  const [product, setProduct] = useState({
    name: '',
    category: '',
    description: '',
    featured: false
  });

  const [variants, setVariants] = useState([
    { unit: '', price: '', discount: 0, stock: '' }
  ]);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        const list = querySnapshot.docs.map(doc => doc.data());
        if (list.length > 0) setCategories(list);
      } catch (error) { console.error(error); }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // --- IMAGE HANDLER ---
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Create local previews for UI immediately
    const newPreviews = files.map(file => URL.createObjectURL(file));
    
    setImageFiles(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setPreviews(newPreviews);
  };

  // --- VARIANT HANDLERS ---
  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const addVariant = () => setVariants([...variants, { unit: '', price: '', discount: 0, stock: '' }]);
  
  const removeVariant = (index) => {
    if (variants.length > 1) setVariants(variants.filter((_, i) => i !== index));
  };

  // --- SUBMIT LOGIC ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (imageFiles.length === 0) return toast.error("Please select at least 1 image");
    
    setLoading(true);
    setUploading(true);

    try {
      // 1. Upload Images to Firebase Storage
      const imageUrls = await Promise.all(
        imageFiles.map(async (file) => {
          const fileRef = ref(storage, `products/${Date.now()}_${file.name}`);
          await uploadBytes(fileRef, file);
          return await getDownloadURL(fileRef);
        })
      );

      // 2. Prepare Data
      const prices = variants.map(v => Number(v.price) - (Number(v.price)*Number(v.discount||0)/100));
      const minPrice = Math.min(...prices);
      const totalStock = variants.reduce((sum, v) => sum + Number(v.stock), 0);

      const finalVariants = variants.map(v => ({
          unit: v.unit,
          price: Number(v.price),
          discount: Number(v.discount || 0),
          stock: Number(v.stock)
      }));

      // 3. Save to Firestore
      await addDoc(collection(db, "products_collection"), {
        ...product,
        // Save first image as main, rest as gallery
        image_url: imageUrls[0], 
        images: imageUrls, 
        variants: finalVariants,
        price: minPrice,         
        stock_quantity: totalStock, 
        sold_count: 0,
        averageRating: 0,
        totalReviews: 0,
        createdAt: new Date()
      });
      
      toast.success('Product Created with Images!');
      navigate('/admin/inventory');
    } catch (error) {
      console.error(error);
      toast.error("Upload failed. Check console.");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="form-container" style={{maxWidth: '850px'}}>
      <button onClick={() => navigate('/admin/inventory')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
        <FaArrowLeft /> Cancel
      </button>

      <div className="form-header">
        <FaPlus size={20} />
        <h2 style={{ margin: 0 }}>Add New Product</h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        
        {/* Basic Info */}
        <div className="form-group">
          <label>Product Name</label>
          <input type="text" name="name" className="form-input" required value={product.name} onChange={handleChange} placeholder="e.g. Pure Coconut Oil" />
        </div>

        <div className="form-group">
          <label>Category</label>
          <select name="category" className="form-select" required value={product.category} onChange={handleChange}>
            <option value="">Select Category</option>
            {categories.length > 0 ? (
              categories.filter(c => c.isActive !== false).map((cat, i) => <option key={i} value={cat.value}>{cat.name}</option>)
            ) : <option value="general">General</option>}
          </select>
        </div>

        {/* Pricing Variants */}
        <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', margin: '20px 0', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 15px 0', color: 'var(--primary-color)' }}>Pricing & Sizes</h4>
            {variants.map((variant, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{flex:2}}><input placeholder="Unit (e.g. 1kg)" className="form-input" required style={{margin:0}} value={variant.unit} onChange={(e) => handleVariantChange(index, 'unit', e.target.value)} /></div>
                    <div style={{flex:1.5}}><input type="number" placeholder="Price" className="form-input" required style={{margin:0}} value={variant.price} onChange={(e) => handleVariantChange(index, 'price', e.target.value)} /></div>
                    <div style={{flex:1.5}}><input type="number" placeholder="Disc %" className="form-input" style={{margin:0}} value={variant.discount} onChange={(e) => handleVariantChange(index, 'discount', e.target.value)} /></div>
                    <div style={{flex:1.5}}><input type="number" placeholder="Qty" className="form-input" required style={{margin:0}} value={variant.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)} /></div>
                    {variants.length > 1 && (
                        <button type="button" onClick={() => removeVariant(index)} style={{ border:'none', background:'#fee2e2', color:'#ef4444', padding:'10px', borderRadius:'4px' }}><FaTrash/></button>
                    )}
                </div>
            ))}
            <button type="button" onClick={addVariant} className="btn-outline" style={{ marginTop: '5px', fontSize:'0.85rem' }}><FaPlus style={{marginRight:'5px'}} /> Add Size</button>
        </div>

        {/* --- IMAGE UPLOADER --- */}
        <div className="form-group" style={{background:'#fcfcfc', border:'2px dashed #e2e8f0', borderRadius:'8px', padding:'20px', textAlign:'center'}}>
          <label style={{cursor:'pointer', display:'block'}}>
             <div style={{fontSize:'2rem', color:'#cbd5e1'}}><FaCloudUploadAlt /></div>
             <span style={{color:'var(--primary-color)', fontWeight:'bold'}}>Click to Upload Images</span>
             <p style={{fontSize:'0.8rem', color:'#94a3b8', marginTop:'5px'}}>Select multiple images (Max 5)</p>
             <input type="file" multiple accept="image/*" onChange={handleImageSelect} style={{display:'none'}} />
          </label>

          {/* Previews */}
          {previews.length > 0 && (
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', marginTop:'15px', justifyContent:'center' }}>
              {previews.map((src, i) => (
                <div key={i} style={{ position:'relative', width:'80px', height:'80px' }}>
                  <img src={src} alt="Preview" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'6px', border:'1px solid #ddd' }} />
                  <button type="button" onClick={() => removeImage(i)} style={{ position:'absolute', top:'-5px', right:'-5px', background:'red', color:'white', borderRadius:'50%', width:'20px', height:'20px', border:'none', cursor:'pointer', fontSize:'10px', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea name="description" className="form-textarea" rows="4" value={product.description} onChange={handleChange} />
        </div>

        <label className="checkbox-group">
          <input type="checkbox" name="featured" checked={product.featured} onChange={handleChange} />
          <span style={{ fontWeight: 600 }}>Mark as Featured</span>
        </label>

        <button className="btn" disabled={loading} type="submit" style={{ width: '100%', marginTop: '10px' }}>
          {loading ? (uploading ? 'Uploading Images...' : 'Saving...') : 'Create Product'}
        </button>
      </form>
    </div>
  );
};

export default AddProduct;