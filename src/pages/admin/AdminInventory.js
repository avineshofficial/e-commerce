import React, { useEffect, useState, useRef } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaEdit, FaBox, FaPlus, FaCloudUploadAlt, FaFileCsv, FaSpinner } from 'react-icons/fa';
import { useToast } from '../../context/ToastContext'; // Use toast for feedback
import AdminSidebar from '../../components/admin/AdminSidebar';

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  
  // Ref for hidden file input
  const fileInputRef = useRef(null);

  // 1. Fetch
  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products_collection"));
      const list = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setProducts(list);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Permanently delete "${name}"?`)) {
      try {
        await deleteDoc(doc(db, "products_collection", id));
        setProducts(prev => prev.filter(p => p.id !== id));
        toast.success("Product deleted.");
      } catch (error) {
        toast.error("Deletion failed.");
      }
    }
  };

  // --- 2. BULK UPLOAD LOGIC ---

  // A. Generate and Download Sample CSV
  const downloadSampleCSV = () => {
    const headers = "Product Name,Category,Price,Stock,Unit,Description,Image URL";
    const example = "\nExample Oil,oil,50,20,1kg,Pure organic oil,https://example.com/image.jpg";
    const csvContent = "data:text/csv;charset=utf-8," + headers + example;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "bulk_product_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // B. Handle File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const csvData = event.target.result;
      await processCSV(csvData);
    };
    
    reader.readAsText(file);
    e.target.value = null; // Reset input
  };

  // C. Parse & Upload to Firebase
  const processCSV = async (csvText) => {
    try {
        const rows = csvText.split('\n');
        // Remove Header row and empty rows
        const dataRows = rows.slice(1).filter(row => row.trim() !== '');

        if(dataRows.length === 0) {
            toast.error("CSV is empty or incorrect format.");
            setImporting(false);
            return;
        }

        const batch = writeBatch(db); // Note: Batch has limit of 500, simpler logic here
        
        const newItems = [];

        // Parse each row
        // Expected Format: Name,Category,Price,Stock,Unit,Desc,Image
        dataRows.forEach(row => {
            // Simple split by comma (doesn't handle commas inside quotes, simple implementation)
            const cols = row.split(',');

            if (cols.length >= 4) { // Basic check
                const name = cols[0]?.trim();
                const category = cols[1]?.trim().toLowerCase();
                const price = Number(cols[2]?.trim()) || 0;
                const stock = Number(cols[3]?.trim()) || 0;
                const unit = cols[4]?.trim() || 'Standard';
                const desc = cols[5]?.trim() || '';
                const img = cols[6]?.trim() || '';

                if (name && price > 0) {
                    const newDocRef = doc(collection(db, "products_collection"));
                    const productData = {
                        name: name,
                        category: category,
                        description: desc,
                        image_url: img,
                        
                        // Auto-create variant structure
                        variants: [{
                           unit: unit,
                           price: price,
                           stock: stock,
                           discount: 0
                        }],
                        
                        // Aggregates
                        price: price,
                        stock_quantity: stock,
                        
                        featured: false,
                        sold_count: 0,
                        averageRating: 0,
                        totalReviews: 0,
                        createdAt: new Date()
                    };

                    batch.set(newDocRef, productData);
                    newItems.push({id: newDocRef.id, ...productData});
                }
            }
        });

        if (newItems.length > 0) {
            await batch.commit();
            toast.success(`Successfully uploaded ${newItems.length} products!`);
            fetchProducts(); // Refresh list
        } else {
            toast.warning("No valid rows found in CSV.");
        }

    } catch (error) {
        console.error(error);
        toast.error("Import Failed: Check CSV format.");
    } finally {
        setImporting(false);
    }
  };

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-content">
        
        {/* Header Alignment */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '25px',
          paddingBottom: '15px',
          borderBottom: '1px solid #e2e8f0',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0, color: '#1f2937' }}>
            <FaBox style={{ color: 'var(--primary-color)' }} /> 
            Inventory <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 'normal' }}>({products.length})</span>
          </h2>

          <div style={{ display: 'flex', gap: '10px' }}>
             {/* TEMPLATE DOWNLOAD BUTTON */}
             <button 
               className="btn secondary" 
               onClick={downloadSampleCSV}
               title="Download CSV Template"
               style={{ fontSize: '0.8rem', padding:'10px 15px' }}
             >
                <FaFileCsv style={{ marginRight:'5px' }} /> Template
             </button>

             {/* HIDDEN FILE INPUT */}
             <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                style={{display:'none'}} 
                onChange={handleFileUpload}
             />

             {/* UPLOAD BUTTON */}
             <button 
               className="btn" 
               onClick={() => fileInputRef.current.click()} // Triggers the hidden input
               disabled={importing}
               style={{ background:'#10b981', display:'flex', alignItems:'center', gap:'8px' }}
             >
               {importing ? <FaSpinner className="fa-spin" /> : <FaCloudUploadAlt />}
               {importing ? 'Importing...' : 'Bulk Import'}
             </button>

             {/* NORMAL ADD BUTTON */}
             <button 
                className="btn" 
                onClick={() => navigate('/admin/add-product')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
             >
                <FaPlus size={12} /> Add New
             </button>
          </div>
        </div>

        {loading ? (
          <p>Loading Inventory...</p>
        ) : (
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: 'var(--shadow)', overflowX: 'auto', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                <tr>
                  <th style={{ padding: '16px' }}>Product</th>
                  <th style={{ padding: '16px' }}>Category</th>
                  <th style={{ padding: '16px' }}>Price</th>
                  <th style={{ padding: '16px' }}>Stock</th>
                  <th style={{ padding: '16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#9ca3af' }}>
                      No products found. Use "Bulk Import" or "Add New" to start.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} className="hover-row">
                      <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <img 
                          src={product.image_url || 'https://via.placeholder.com/50'} 
                          alt={product.name} 
                          style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }} 
                        />
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>{product.name}</div>
                          {product.featured && <span style={{ fontSize: '0.7rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Featured</span>}
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#64748b', textTransform: 'capitalize', fontWeight: '500' }}>
                        {product.category}
                      </td>
                      <td style={{ padding: '16px', fontWeight: '700', color: '#0f172a' }}>
                        ₹{product.price}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          color: product.stock_quantity < 5 ? '#dc2626' : '#16a34a', 
                          fontWeight: 'bold', 
                          background: product.stock_quantity < 5 ? '#fef2f2' : '#f0fdf4', 
                          padding: '4px 10px', 
                          borderRadius: '20px',
                          fontSize: '0.85rem'
                        }}>
                          {product.stock_quantity} Left
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button 
                            className="btn secondary" 
                            style={{ padding: '8px', color: '#4b5563', border: '1px solid #e5e7eb' }}
                            onClick={() => navigate(`/admin/edit-product/${product.id}`)}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            style={{ 
                              background: '#fee2e2', color: '#ef4444', border: 'none', 
                              padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', transition: '0.2s'
                            }}
                            onClick={() => handleDelete(product.id, product.name)}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
      
      <style>{`
        .hover-row:hover { background-color: #f8fafc; }
        .secondary { border: 1px solid #cbd5e1; background: #fff; color: #475569; }
      `}</style>
    </div>
  );
};

export default AdminInventory;