import React, { useState } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { FaFileCsv, FaDownload, FaChartPie, FaSpinner } from 'react-icons/fa';
import '../../styles/Admin.css';

const AdminReports = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState(null); // 'orders', 'products', 'users'

  // Helper: Convert Array of Objects to CSV and Download
  const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert("No data available to export.");
      return;
    }

    // 1. Extract Headers (Keys)
    const headers = Object.keys(data[0]);
    
    // 2. Format CSV Rows
    const csvRows = [
      headers.join(','), // Header Row
      ...data.map(row => 
        headers.map(header => {
          let val = row[header] || ''; // Handle null/undefined
          // Escape quotes and wrap string in quotes if it contains commas
          val = String(val).replace(/"/g, '""'); 
          if (val.search(/("|,|\n)/g) >= 0) {
            val = `"${val}"`;
          }
          return val;
        }).join(',')
      )
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    
    // 3. Create Link and Trigger Click
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- REPORT GENERATORS ---

  const generateSalesreport = async () => {
    setLoading(true);
    setReportType('orders');
    try {
      const snapshot = await getDocs(collection(db, "orders_collection"));
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          OrderID: doc.id,
          Date: d.date ? new Date(d.date.seconds * 1000).toLocaleDateString() : 'N/A',
          CustomerName: d.shipping_details?.fullName || 'Guest',
          CustomerPhone: d.user_phone,
          Amount: d.total_amount,
          Status: d.status,
          Payment: d.payment_mode,
          ItemCount: d.items?.length || 0,
          ItemsSummary: d.items?.map(i => `${i.name} (x${i.quantity})`).join(" | ") // Flatten array
        };
      });
      downloadCSV(data, 'Sales_Report');
    } catch (error) { console.error(error); alert("Export failed"); } 
    finally { setLoading(false); }
  };

  const generateInventoryReport = async () => {
    setLoading(true);
    setReportType('products');
    try {
      const snapshot = await getDocs(collection(db, "products_collection"));
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          ProductID: doc.id,
          Name: d.name,
          Category: d.category,
          Price: d.price,
          StockQuantity: d.stock_quantity,
          Status: d.stock_quantity < 5 ? 'Low Stock' : 'In Stock',
          SoldLifetime: d.sold_count || 0
        };
      });
      downloadCSV(data, 'Inventory_Sheet');
    } catch (error) { console.error(error); alert("Export failed"); } 
    finally { setLoading(false); }
  };

  const generateUserList = async () => {
    setLoading(true);
    setReportType('users');
    try {
      const snapshot = await getDocs(collection(db, "users_collection"));
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          UID: doc.id,
          Name: d.displayName,
          Phone: d.phone_number,
          Email: d.email || '-',
          City: d.city || '-',
          RegisteredAddresses: d.addresses ? 'Multiple' : 'None'
        };
      });
      downloadCSV(data, 'Customer_List');
    } catch (error) { console.error(error); alert("Export failed"); } 
    finally { setLoading(false); }
  };

  return (
    <div className="admin-container">
      <AdminSidebar />
      <main className="admin-content">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaChartPie /> Reports & Exports
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '30px' }}>Download your store data for offline analysis, accounting, or backup.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          
          {/* Sales Report Card */}
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ marginTop: 0 }}>Sales & Orders</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', minHeight: '40px' }}>
              Full export of all orders, including items bought, customer details, and total revenue.
            </p>
            <button 
              className="btn" 
              onClick={generateSalesreport}
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', background: '#4f46e5' }}
            >
              {loading && reportType === 'orders' ? <FaSpinner className="fa-spin" /> : <><FaDownload /> Download Sales CSV</>}
            </button>
          </div>

          {/* Inventory Report Card */}
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ marginTop: 0 }}>Inventory Status</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', minHeight: '40px' }}>
              Current stock levels, sold counts, and low-stock alerts. Useful for re-stocking.
            </p>
            <button 
              className="btn" 
              onClick={generateInventoryReport}
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', background: '#10b981' }}
            >
              {loading && reportType === 'products' ? <FaSpinner className="fa-spin" /> : <><FaDownload /> Download Stock CSV</>}
            </button>
          </div>

          {/* Customer Report Card */}
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ marginTop: 0 }}>Customer List</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', minHeight: '40px' }}>
              Database of all registered users, phone numbers, and locations for marketing (SMS/Email).
            </p>
            <button 
              className="btn" 
              onClick={generateUserList}
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', background: '#f59e0b' }}
            >
              {loading && reportType === 'users' ? <FaSpinner className="fa-spin" /> : <><FaDownload /> Download Users CSV</>}
            </button>
          </div>

        </div>

        {/* --- TIPS SECTION --- */}
        <div style={{ marginTop: '40px', background: '#f8fafc', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
          <strong>💡 Pro Tip:</strong> 
          <span style={{ marginLeft: '10px', color: '#4b5563' }}>
            The downloaded CSV files can be opened in <em>Microsoft Excel</em> or <em>Google Sheets</em> for advanced pivot tables and charting.
          </span>
        </div>
      </main>
    </div>
  );
};

export default AdminReports;