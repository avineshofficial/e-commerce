import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage } from '../../config/firebase'; // Added Storage
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Storage methods
import { FaEdit, FaSave, FaArrowLeft, FaTrash, FaPlus, FaCloudUploadAlt, FaSpinner, FaTimes } from 'react-icons/fa';
import { useToast } from '../../context/ToastContext';
import '../../styles/Form.css';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);

  // Product Data
  const [product, setProduct] = useState({
    name: '',
    category: '',
    description: '',
    featured: false
  });

  // Variant Data
  const [variants, setVariants] = useState([]);

  // --- IMAGE STATE ---
  // 1. URLs that are already saved in Database
  const [existingImages, setExistingImages] = useState([]); 
  // 2. New Files selected from computer (Files)
  const [newImageFiles, setNewImageFiles] = useState([]);
  // 3. Previews for new files (Blob URLs)
  const [newPreviews, setNewPreviews] = useState([]);

  // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const catSnap = await getDocs(collection(db, "categories"));
        const catList = catSnap.docs.map(d => d.data());
        if (catList.length > 0) setCategories(catList);

        const docRef = doc(db, "products_collection", id);
        const snapshot = await getDoc(docRef);
        
        if (snapshot.exists()) {
          const data = snapshot.data();
          setProduct({
            name: data.name || '',
            category: data.category || '',
            description: data.description || '',
            featured: data.featured || false
          });

          // Handle Variants
          if (data.variants && data.variants.length > 0) {
            setVariants(data.variants);
          } else {
            setVariants([{ unit: 'Standard', price: data.price || 0, discount: data.discount || 0, stock: data.stock_quantity || 0 }]);
          }

          // Handle Images
          // Prefer 'images' array, fallback to 'image_url' string
          if (data.images && Array.isArray(data.images)) {
             setExistingImages(data.images);
          } else if (data.image_url) {
             setExistingImages([data.image_url]);
          }

        } else {
          toast.error("Product not found!");
          navigate('/admin/inventory');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate, toast]);

  // --- IMAGE HANDLERS ---
  
  // Select Files from Computer
  const handleFileSelect = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const filePreviews = files.map(file => URL.createObjectURL(file));

      setNewImageFiles(prev => [...prev, ...files]);
      setNewPreviews(prev => [...prev, ...filePreviews]);
    }
  };

  // Remove Newly Selected File
  const removeNewFile = (index) => {
     setNewImageFiles(prev => prev.filter((_, i) => i !== index));
     setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Remove Existing DB Image
  const removeExistingImage = (index) => {
     setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  // --- FORM HANDLERS ---

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const addVariant = () => setVariants([...variants, { unit: '', price: '', discount: 0, stock: '' }]);

  const removeVariant = (index) => {
    if (variants.length > 1) setVariants(variants.filter((_, i) => i !== index));
    else toast.warning("Product must have at least one size.");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!product.name) return toast.error("Name is required");

    setSaving(true);
    try {
        // 1. Upload NEW Images (if any)
        let uploadedUrls = [];
        if (newImageFiles.length > 0) {
            uploadedUrls = await Promise.all(
                newImageFiles.map(async (file) => {
                    const storageRef = ref(storage, `products/${id}_${Date.now()}_${file.name}`);
                    await uploadBytes(storageRef, file);
                    return await getDownloadURL(storageRef);
                })
            );
        }

        // 2. Merge Existing + New Images
        const finalImages = [...existingImages, ...uploadedUrls];
        const mainImage = finalImages.length > 0 ? finalImages[0] : '';

        // 3. Process Variants
        const finalVariants = variants.map(v => ({
            unit: v.unit,
            price: Number(v.price),
            discount: Number(v.discount || 0),
            stock: Number(v.stock)
        }));

        // Calculate aggregates
        const prices = finalVariants.map(v => Number(v.price) - (Number(v.price)*Number(v.discount||0)/100));
        const minPrice = Math.min(...prices);
        const totalStock = finalVariants.reduce((sum, v) => sum + Number(v.stock), 0);

        // 4. Update Firestore
        const docRef = doc(db, "products_collection", id);
        await updateDoc(docRef, {
            ...product,
            images: finalImages,
            image_url: mainImage, // Main thumbnail
            variants: finalVariants,
            price: minPrice,         
            stock_quantity: totalStock,
        });

        toast.success("Product Saved!");
        navigate('/admin/inventory');
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{padding:'50px', textAlign:'center'}}>Loading...</div>;

  return (
    <div className="form-container" style={{ maxWidth: '850px' }}>
      <button 
        onClick={() => navigate('/admin/inventory')}
        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}
      >
        <FaArrowLeft /> Back
      </button>

      <div className="form-header">
        <FaEdit size={24} />
        <h2 style={{ margin: 0 }}>Edit Product</h2>
      </div>

      <form onSubmit={handleUpdate}>
        
        {/* Main Info */}
        <div className="form-group">
          <label>Product Name</label>
          <input className="form-input" required value={product.name} onChange={handleChange} name="name" />
        </div>

        <div className="form-group">
          <label>Category</label>
          <select className="form-select" required value={product.category} name="category" onChange={handleChange}>
            {categories.map((c, i) => <option key={i} value={c.value}>{c.name}</option>)}
          </select>
        </div>

        {/* --- IMAGE MANAGER --- */}
        <div style={{ background: '#fff', border:'1px dashed #cbd5e1', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h4 style={{ margin:'0 0 10px 0', color: '#334155' }}>Product Images</h4>
            
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                
                {/* 1. Existing Images */}
                {existingImages.map((img, idx) => (
                    <div key={`exist-${idx}`} style={{ position: 'relative', width:'80px', height:'80px', border:'1px solid #e2e8f0', borderRadius:'6px' }}>
                        <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'6px' }} />
                        <button type="button" onClick={() => removeExistingImage(idx)} style={{ position:'absolute', top:'-5px', right:'-5px', background:'red', color:'white', border:'none', borderRadius:'50%', width:'20px', height:'20px', cursor:'pointer', display:'flex', justifyContent:'center', alignItems:'center', fontSize:'10px' }}><FaTimes/></button>
                    </div>
                ))}

                {/* 2. New Previews */}
                {newPreviews.map((img, idx) => (
                    <div key={`new-${idx}`} style={{ position: 'relative', width:'80px', height:'80px', border:'2px solid #a5b4fc', borderRadius:'6px' }}>
                        <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'6px' }} />
                        <button type="button" onClick={() => removeNewFile(idx)} style={{ position:'absolute', top:'-5px', right:'-5px', background:'red', color:'white', border:'none', borderRadius:'50%', width:'20px', height:'20px', cursor:'pointer', display:'flex', justifyContent:'center', alignItems:'center', fontSize:'10px' }}><FaTimes/></button>
                        <div style={{position:'absolute', bottom:0, width:'100%', background:'rgba(0,0,0,0.5)', color:'white', fontSize:'8px', textAlign:'center'}}>New</div>
                    </div>
                ))}

                {/* 3. Upload Button */}
                <label style={{ 
                    width:'80px', height:'80px', border:'2px dashed var(--primary-color)', borderRadius:'6px', 
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', 
                    cursor:'pointer', background:'#eef2ff', color:'var(--primary-color)' 
                }}>
                    <FaCloudUploadAlt size={20} />
                    <span style={{ fontSize:'0.7rem', fontWeight:'bold' }}>Upload</span>
                    <input type="file" multiple accept="image/*" style={{display:'none'}} onChange={handleFileSelect}/>
                </label>

            </div>
        </div>

        {/* Variants Manager (Same as before) */}
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', margin: '20px 0' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#334155' }}>Pricing & Stock Variants</h4>
            {variants.map((v, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <input className="form-input" style={{flex:2, margin:0}} placeholder="Size (1kg)" value={v.unit} onChange={e=>handleVariantChange(i, 'unit', e.target.value)} />
                    <input type="number" className="form-input" style={{flex:1, margin:0}} placeholder="₹ Price" value={v.price} onChange={e=>handleVariantChange(i, 'price', e.target.value)} />
                    <input type="number" className="form-input" style={{flex:1, margin:0}} placeholder="% Off" value={v.discount} onChange={e=>handleVariantChange(i, 'discount', e.target.value)} />
                    <input type="number" className="form-input" style={{flex:1, margin:0}} placeholder="Qty" value={v.stock} onChange={e=>handleVariantChange(i, 'stock', e.target.value)} />
                    {variants.length > 1 && <button type="button" onClick={() => removeVariant(i)} style={{background:'transparent', border:'none', color:'#ef4444', cursor:'pointer'}}><FaTrash/></button>}
                </div>
            ))}
            <button type="button" onClick={addVariant} className="btn-outline" style={{ marginTop:'10px', fontSize:'0.8rem' }}><FaPlus style={{marginRight:'5px'}}/> Add Size</button>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea name="description" className="form-textarea" rows="4" value={product.description} onChange={handleChange} />
        </div>

        <label className="checkbox-group">
          <input type="checkbox" name="featured" checked={product.featured} onChange={handleChange} />
          <span style={{ fontWeight: 600 }}>Mark as Featured</span>
        </label>

        <button 
          type="submit" 
          className="btn" 
          disabled={saving}
          style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', marginTop: '15px' }}
        >
          {saving ? <><FaSpinner className="fa-spin" style={{marginRight:'8px'}}/> Saving...</> : <><FaSave style={{marginRight:'8px'}}/> Update Product</>}
        </button>
      </form>
    </div>
  );
};

export default EditProduct;