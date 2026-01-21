import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import AdminSidebar from '../../components/admin/AdminSidebar';
import Loader from '../../components/common/Loader';
import { FaRupeeSign, FaShoppingCart, FaBoxOpen, FaExclamationTriangle, FaArrowUp, FaTrophy, FaChartLine } from 'react-icons/fa';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import '../../styles/Admin.css';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  
  const [overview, setOverview] = useState({ today: 0, month: 0, totalRevenue: 0, pending: 0 });
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockList, setLowStockList] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const ordersRef = collection(db, "orders_collection");
      const productsRef = collection(db, "products_collection");
      
      const [ordersSnap, productsSnap] = await Promise.all([
        getDocs(ordersRef),
        getDocs(productsRef)
      ]);

      const orders = ordersSnap.docs.map(d => ({
          ...d.data(), 
          id: d.id,
          dateObject: d.data().date ? d.data().date.toDate() : new Date() 
      }));
      
      const products = productsSnap.docs.map(d => d.data());

      // --- LOGIC (Simplified for readability) ---
      const today = new Date();
      today.setHours(0,0,0,0);
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      let revenueTotal = 0;
      let revenueToday = 0;
      let revenueMonth = 0;
      let pendingCount = 0;

      const last7DaysMap = {};
      for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', day:'numeric' });
        last7DaysMap[dateStr] = 0;
      }

      orders.forEach(order => {
        const amount = Number(order.total_amount) || 0;
        const oDate = order.dateObject;

        if (order.status !== 'Cancelled') {
           if(order.status === 'Delivered') revenueTotal += amount;
           if(order.status === 'Pending') pendingCount++;

           // Chart uses Delivered + Shipped or just Paid
           if (oDate >= today && order.status === 'Delivered') revenueToday += amount;
           if (oDate >= startOfMonth && order.status === 'Delivered') revenueMonth += amount;

           // Populating chart
           const orderDayStr = oDate?.toLocaleDateString('en-US', { weekday: 'short', day:'numeric' });
           if(last7DaysMap.hasOwnProperty(orderDayStr)) {
             // You can filter chart data by status here if desired
             last7DaysMap[orderDayStr] += amount; 
           }
        }
      });

      const chartArray = Object.keys(last7DaysMap).map(key => ({
        name: key,
        sales: last7DaysMap[key]
      }));

      const sortedBySold = [...products].sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0));
      const top5 = sortedBySold.slice(0, 5);
      const lowStock = products.filter(p => p.stock_quantity < 5);

      setOverview({
        totalRevenue: revenueTotal,
        today: revenueToday,
        month: revenueMonth,
        pending: pendingCount,
        products: products.length
      });
      setChartData(chartArray);
      setTopProducts(top5);
      setLowStockList(lowStock);

    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  if (loading) return <Loader text="Refreshing business data..." />;

  return (
    <div className="admin-container">
      <AdminSidebar />
      <main className="admin-content">
        
        {/* Header */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px'}}>
          <div>
            <h2 style={{margin:0, color:'#1e293b'}}>Business Dashboard</h2>
            <p style={{margin:0, color:'#64748b', fontSize:'0.9rem'}}>Overview of your store performance</p>
          </div>
          <button className="btn secondary" onClick={fetchDashboardData} style={{fontSize:'0.8rem', padding:'8px 16px'}}>
            Refresh Data
          </button>
        </div>

        {/* 1. KEY METRICS GRID - USING NEW CSS CLASS */}
        <div className="dashboard-grid">
          
          <div className="stat-card" style={{ borderLeft: '4px solid var(--primary-color)' }}>
            <div className="stat-card-inner">
               <div>
                  <div className="stat-label">TOTAL REVENUE</div>
                  <div className="stat-value" style={{color: '#4f46e5'}}>₹{overview.totalRevenue.toLocaleString()}</div>
               </div>
               <div className="stat-icon-circle" style={{background:'#e0e7ff', color:'#4f46e5'}}>
                 <FaRupeeSign />
               </div>
            </div>
            <div className="stat-subtext" style={{color: '#64748b'}}>
               Lifetime
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="stat-card-inner">
               <div>
                  <div className="stat-label">MONTHLY SALES</div>
                  <div className="stat-value" style={{color: '#10b981'}}>₹{overview.month.toLocaleString()}</div>
               </div>
               <div className="stat-icon-circle" style={{background:'#d1fae5', color:'#059669'}}>
                 <FaChartLine />
               </div>
            </div>
            <div className="stat-subtext" style={{color: '#16a34a'}}>
               <FaArrowUp size={10} /> Performance
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="stat-card-inner">
               <div>
                  <div className="stat-label">PENDING ORDERS</div>
                  <div className="stat-value" style={{color: '#f59e0b'}}>{overview.pending}</div>
               </div>
               <div className="stat-icon-circle" style={{background:'#fef3c7', color:'#d97706'}}>
                 <FaShoppingCart />
               </div>
            </div>
            <div className="stat-subtext" style={{color: '#d97706'}}>
               Action Required
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div className="stat-card-inner">
               <div>
                  <div className="stat-label">TODAY'S REVENUE</div>
                  <div className="stat-value" style={{color: '#3b82f6'}}>₹{overview.today.toLocaleString()}</div>
               </div>
               <div className="stat-icon-circle" style={{background:'#eff6ff', color:'#2563eb'}}>
                 <FaRupeeSign />
               </div>
            </div>
            <div className="stat-subtext" style={{color: '#64748b'}}>
               Updates Live
            </div>
          </div>

        </div>

        {/* 2. CHARTS + RANKINGS (GRID SPLIT 2/3 and 1/3) */}
        <div className="analytics-grid">
           
           {/* LEFT COLUMN: Revenue Chart */}
           <div className="chart-container">
               <div className="section-header">
                  <h3>Revenue Trend (7 Days)</h3>
                  <div className="stat-pill">Weekly View</div>
               </div>
               <div style={{width:'100%', height:'320px'}}>
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                         <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <XAxis dataKey="name" style={{fontSize:'0.75rem'}} stroke="#94a3b8" tickLine={false} axisLine={false} />
                     <YAxis style={{fontSize:'0.75rem'}} stroke="#94a3b8" tickLine={false} axisLine={false} />
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <Tooltip contentStyle={{ borderRadius:'8px', border:'none', boxShadow:'0 10px 25px rgba(0,0,0,0.1)' }} />
                     <Area type="monotone" dataKey="sales" stroke="#4f46e5" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
           </div>

           {/* RIGHT COLUMN: Top Sellers & Low Stock */}
           <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* TOP PRODUCTS */}
              <div className="stat-card" style={{ height: 'auto', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                 <div className="section-header" style={{ marginBottom: '10px' }}>
                    <h3><FaTrophy style={{color:'#f59e0b', marginRight:'8px'}}/> Top Sellers</h3>
                 </div>
                 
                 <div>
                   {topProducts.length === 0 ? <p style={{color:'#94a3b8', fontStyle:'italic', fontSize:'0.9rem'}}>No sales yet.</p> : (
                     topProducts.map((prod, index) => (
                       <div key={index} className="top-product-item" style={{ padding: '8px 0', borderBottom: '1px dashed #f1f5f9' }}>
                          <div className={`rank-badge rank-${index+1}`} style={{ minWidth:'24px' }}>{index+1}</div>
                          <img 
                             src={prod.image_url || 'https://via.placeholder.com/30'} alt="" 
                             style={{width:'32px', height:'32px', borderRadius:'6px', objectFit:'cover', background:'#f8fafc'}}
                          />
                          <div style={{flex:1, minWidth:0}}>
                             <div style={{fontSize:'0.85rem', fontWeight:'600', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{prod.name}</div>
                             <div style={{fontSize:'0.7rem', color:'#64748b'}}>₹{prod.price}</div>
                          </div>
                          <div style={{fontSize:'0.8rem', fontWeight:'700', color:'#1f2937'}}>{prod.sold_count} sold</div>
                       </div>
                     ))
                   )}
                 </div>
              </div>

              {/* LOW STOCK ALERTS (Small) */}
              <div className="stat-card" style={{ height: 'auto', border: '1px solid #fecaca', background:'#fff5f5' }}>
                 <div className="section-header" style={{ borderBottomColor:'#fed7d7' }}>
                    <h3 style={{fontSize:'1rem', color:'#c53030'}}><FaExclamationTriangle style={{marginRight:'5px'}}/> Low Stock</h3>
                 </div>
                 {lowStockList.length === 0 ? (
                    <p style={{color:'#2f855a', fontSize:'0.85rem', margin:0}}>Stock levels are good!</p>
                 ) : (
                    lowStockList.slice(0, 3).map(item => (
                       <div key={item.name} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', marginBottom:'5px', color:'#9b2c2c' }}>
                          <span style={{ fontWeight:'600' }}>{item.name.substring(0,18)}</span>
                          <span style={{ background:'#c53030', color:'white', borderRadius:'4px', padding:'1px 5px', fontSize:'0.7rem' }}>
                            {item.stock_quantity} left
                          </span>
                       </div>
                    ))
                 )}
                 {lowStockList.length > 3 && <div style={{textAlign:'center', fontSize:'0.75rem', color:'#c53030'}}>+ {lowStockList.length - 3} others</div>}
              </div>

           </div>
        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;