import React, { useEffect, useState } from 'react';
import { db, storage } from '../../config/firebase'; 
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { FaImages, FaTrash, FaPlus, FaLink, FaCloudUploadAlt, FaSpinner } from 'react-icons/fa';
import { useToast } from '../../context/ToastContext';
import '../../styles/Form.css';

const ManageSliders = () => {
  const toast = useToast();
  
  const [slides, setSlides] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // New Slide State
  const [imageFile, setImageFile] = useState(null); 
  const [previewUrl, setPreviewUrl] = useState(''); 
  
  const [newSlide, setNewSlide] = useState({
    title: '',
    subtitle: '',
    btnText: 'Shop Now',
    category: 'all',
    image: ''
  });

  // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const slidesSnap = await getDocs(collection(db, "hero_slides"));
        const slidesList = slidesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSlides(slidesList);

        const catsSnap = await getDocs(collection(db, "categories"));
        const catsList = catsSnap.docs.map(doc => doc.data());
        setCategories(catsList);
      } catch (error) {
        console.error(error);
        toast.error("Error loading data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleImageSelect = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if(!newSlide.title) return toast.warning("Title is required");
    if(!imageFile) return toast.warning("Please upload a banner image");
    
    setUploading(true);
    try {
      const fileRef = ref(storage, `banners/${Date.now()}_${imageFile.name}`);
      await uploadBytes(fileRef, imageFile);
      const downloadUrl = await getDownloadURL(fileRef);

      await addDoc(collection(db, "hero_slides"), {
        ...newSlide,
        image: downloadUrl 
      });

      setImageFile(null);
      setPreviewUrl('');
      setNewSlide({ title: '', subtitle: '', btnText: 'Shop Now', category: 'all', image: '' });
      toast.success("Banner Slider Added!");
      
      const refreshSnap = await getDocs(collection(db, "hero_slides"));
      setSlides(refreshSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload slide.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this banner?")) return;
    try {
      await deleteDoc(doc(db, "hero_slides", id));
      setSlides(slides.filter(s => s.id !== id));
      toast.info("Slide removed");
    } catch (err) { toast.error("Error deleting"); }
  };

  return (
    <div className="admin-container">
      <AdminSidebar />
      <main className="admin-content">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaImages /> Manage Homepage Sliders
        </h2>

        {/* --- ADD SLIDE FORM --- */}
        <div className="form-container" style={{ margin: '0 0 30px 0', maxWidth: '100%', padding:'25px' }}>
          <h4 style={{ margin: '0 0 20px 0' }}>Add New Banner</h4>
          
          {/* UPDATED: Uses responsive Grid now (Stack on Mobile, Split on Desktop) */}
          <form onSubmit={handleAdd} className="responsive-form-grid">
            
            {/* Input Column */}
            <div style={{ display:'flex', flexDirection:'column', gap:'15px', minWidth: '250px' }}>
                <div className="form-group">
                   <label>Banner Title</label>
                   <input 
                      placeholder="e.g. Summer Sale" className="form-input" required 
                      value={newSlide.title} onChange={e => setNewSlide({...newSlide, title: e.target.value})} 
                   />
                </div>

                <div className="form-group">
                   <label>Subtitle (Optional)</label>
                   <input 
                      placeholder="Short description" className="form-input" 
                      value={newSlide.subtitle} onChange={e => setNewSlide({...newSlide, subtitle: e.target.value})} 
                   />
                </div>

                <div className="form-row-responsive">
                   <div className="form-group" style={{flex:1}}>
                      <label>Button Text</label>
                      <input 
                          placeholder="Shop Now" className="form-input" 
                          value={newSlide.btnText} onChange={e => setNewSlide({...newSlide, btnText: e.target.value})} 
                      />
                   </div>
                   <div className="form-group" style={{flex:1}}>
                      <label>Link To Action</label>
                      <select 
                         className="form-select" 
                         value={newSlide.category} 
                         onChange={e => setNewSlide({...newSlide, category: e.target.value})}
                      >
                          <option value="all">Link to: All</option>
                          <option value="OFFERS_LINK">Link to: Offers</option>
                          {categories.filter(c => c.isActive !== false).map((cat, idx) => (
                              <option key={idx} value={cat.value}>{cat.name}</option>
                          ))}
                      </select>
                   </div>
                </div>
            </div>

            {/* Image Uploader Column */}
            <div style={{ minWidth: '250px' }}>
               <label style={{fontWeight:'500', marginBottom:'8px', display:'block'}}>Banner Image</label>
               <div style={{
                  border:'2px dashed #e2e8f0', borderRadius:'12px', padding:'20px', textAlign:'center',
                  background: '#f8fafc', height: '180px', display: 'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative'
               }}>
                  {previewUrl ? (
                      <>
                        <img src={previewUrl} alt="Preview" style={{ maxHeight: '100%', maxWidth:'100%', objectFit: 'cover', borderRadius: '8px' }} />
                        <button type="button" onClick={() => { setPreviewUrl(''); setImageFile(null); }} style={{ position:'absolute', top:'10px', right:'10px', background:'white', border:'1px solid #ddd', borderRadius:'50%', width:'25px', height:'25px', cursor:'pointer' }}>x</button>
                      </>
                  ) : (
                      <label style={{cursor:'pointer', width:'100%', height:'100%', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
                          <FaCloudUploadAlt size={30} color="#cbd5e1"/>
                          <span style={{color:'var(--primary-color)', marginTop:'10px', fontWeight:'600'}}>Click to Upload</span>
                          <span style={{fontSize:'0.7rem', color:'#94a3b8'}}>Supports JPG, PNG</span>
                          <input type="file" accept="image/*" onChange={handleImageSelect} style={{display:'none'}} />
                      </label>
                  )}
               </div>
            </div>
            
            {/* Submit */}
            <button 
              type="submit" 
              className="btn" 
              style={{ gridColumn: '1 / -1', padding:'15px', justifyContent:'center', marginTop:'10px' }}
              disabled={uploading}
            >
               {uploading ? <><FaSpinner className="fa-spin" /> Uploading...</> : <><FaPlus /> Create Slider Banner</>}
            </button>

          </form>
        </div>

        {/* --- LIST EXISTING SLIDES --- */}
        <h4 style={{ marginBottom: '20px' }}>Active Sliders</h4>
        
        {loading ? <p>Loading slides...</p> : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {slides.length === 0 ? <p style={{color:'#999'}}>No banners active.</p> : slides.map(slide => (
              <div key={slide.id} style={{ 
                background: 'white', padding: '15px', borderRadius: '12px', 
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px',
                border: '1px solid #f1f5f9', flexWrap: 'wrap' // Enable wrap for mobile items
              }}>
                <img src={slide.image} alt={slide.title} style={{ width: '120px', height: '60px', objectFit: 'cover', borderRadius: '6px', background:'#f1f5f9' }} />
                
                <div style={{ flex: 1, minWidth:'150px' }}>
                  <h4 style={{ margin: '0 0 5px 0' }}>{slide.title}</h4>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', fontSize:'0.85rem', color:'#6b7280' }}>
                     {slide.subtitle && <span>{slide.subtitle}</span>}
                     <span style={{ color:'var(--primary-color)', fontWeight:'500', display:'flex', alignItems:'center', gap:'5px' }}>
                        <FaLink size={10} /> Link: {slide.category}
                     </span>
                  </div>
                </div>

                <button onClick={() => handleDelete(slide.id)} className="btn secondary" style={{ color: '#ef4444', background: '#fee2e2', padding:'10px' }}>
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Internal CSS for Grid Responsiveness */}
      <style>{`
        .responsive-form-grid {
           display: grid;
           gap: 30px;
           grid-template-columns: 1fr 1fr;
           align-items: start;
        }
        .form-row-responsive {
           display: flex; 
           gap: 15px;
        }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
           .responsive-form-grid {
             grid-template-columns: 1fr; /* Stack vertically on mobile */
             gap: 20px;
           }
           .form-row-responsive {
              /* Keep button text and category side-by-side or stack if really small? */
              flex-direction: row; 
           }
           /* On very small screens, stack everything */
           @media (max-width: 400px) {
              .form-row-responsive { flex-direction: column; gap: 10px; }
           }
        }
      `}</style>
    </div>
  );
};

export default ManageSliders;