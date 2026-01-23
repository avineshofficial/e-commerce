import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';
import { PrivateRoute, AdminRoute } from './components/common/RouteGuards';
import ScrollToTop from './components/common/ScrollToTop'; 
import './styles/App.css';

// Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';

// Pages - Public
import Home from './pages/Home';
import Login from './pages/Login';
import ProductDetails from './pages/ProductDetails';
import Offers from './pages/public/Offers';
import TrackOrder from './pages/public/TrackOrder';
import About from './pages/public/About';
import Policy from './pages/public/Policy';
import HelpCenter from './pages/public/HelpCenter';
import Contact from './pages/public/Contact'; // <--- IMPORT ADDED
import NotFound from './pages/NotFound';

// Pages - User
import Cart from './pages/user/Cart';
import Checkout from './pages/user/Checkout';
import OrderSuccess from './pages/user/OrderSuccess';
import UserOrders from './pages/user/UserOrders';
import UserProfile from './pages/user/UserProfile';
import Wishlist from './pages/user/Wishlist';
import OrderDetails from './pages/user/OrderDetails';
import Settings from './pages/user/Settings';

// Pages - Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AddProduct from './pages/admin/AddProduct';
import EditProduct from './pages/admin/EditProduct';
import ManageOrders from './pages/admin/ManageOrders';
import AdminInventory from './pages/admin/AdminInventory';
import ManageCategories from './pages/admin/ManageCategories';
import ManageSliders from './pages/admin/ManageSliders';
import ManageCoupons from './pages/admin/ManageCoupons';
import ManageUsers from './pages/admin/ManageUsers';
import AdminReports from './pages/admin/AdminReports';
import AdminMessages from './pages/admin/AdminMessages';
import ManageReviews from './pages/admin/ManageReviews';
import ManageTeam from './pages/admin/ManageTeam';
import Billing from './pages/admin/Billing';
import PrintReceipt from './pages/admin/PrintReceipt'; // Import Receipt Page
import { ProductProvider } from './context/ProductContext';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ProductProvider> {/* <--- WRAP HERE (Must be inside Auth/outside Cart works too) */}
          <CartProvider>
            <WishlistProvider>
               <Router>
              <ScrollToTop />
              
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Header />
                
                <main style={{ flex: 1 }}>
                  <Routes>
                    {/* --- PUBLIC ROUTES --- */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/product/:id" element={<ProductDetails />} />
                    <Route path="/offers" element={<Offers />} />
                    <Route path="/track-order" element={<TrackOrder />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/legal" element={<Policy />} />
                    <Route path="/help" element={<HelpCenter />} />
                    
                    {/* FIXED: Now renders the real Contact Form */}
                    <Route path="/contact" element={<Contact />} />

                    {/* --- USER ROUTES --- */}
                    <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
                    <Route path="/order-success" element={<PrivateRoute><OrderSuccess /></PrivateRoute>} />
                    <Route path="/dashboard" element={<PrivateRoute><UserOrders /></PrivateRoute>} />
                    <Route path="/order/:id" element={<PrivateRoute><OrderDetails /></PrivateRoute>} />
                    <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
                    <Route path="/wishlist" element={<PrivateRoute><Wishlist /></PrivateRoute>} />
                    <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                    
                    {/* --- ADMIN ROUTES --- */}
                    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                    <Route path="/admin/add-product" element={<AdminRoute><AddProduct /></AdminRoute>} />
                    <Route path="/admin/edit-product/:id" element={<AdminRoute><EditProduct /></AdminRoute>} />
                    <Route path="/admin/inventory" element={<AdminRoute><AdminInventory /></AdminRoute>} />
                    <Route path="/admin/categories" element={<AdminRoute><ManageCategories /></AdminRoute>} />
                    <Route path="/admin/orders" element={<AdminRoute><ManageOrders /></AdminRoute>} />
                    <Route path="/admin/sliders" element={<AdminRoute><ManageSliders /></AdminRoute>} />
                    <Route path="/admin/coupons" element={<AdminRoute><ManageCoupons /></AdminRoute>} />
                    <Route path="/admin/users" element={<AdminRoute><ManageUsers /></AdminRoute>} />
                    <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
                    <Route path="/admin/messages" element={<AdminRoute><AdminMessages /></AdminRoute>} />
                    <Route path="/admin/reviews" element={<AdminRoute><ManageReviews /></AdminRoute>} />
                    <Route path="/admin/team" element={<AdminRoute><ManageTeam /></AdminRoute>} />
                    <Route path="/admin/billing" element={<AdminRoute><Billing /></AdminRoute>} />
                    
                    {/* Receipt Print Route (No Header/Footer on print logic inside) */}
                    <Route path="/print-receipt/:id" element={<AdminRoute><PrintReceipt /></AdminRoute>} />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>

                <Footer />
                
              </div>
            </Router>
            </WishlistProvider>
          </CartProvider>
        </ProductProvider> 
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;