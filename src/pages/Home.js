import React, { useEffect, useState, useLayoutEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import ProductCard from '../components/products/ProductCard';
import SearchFilter from '../components/common/SearchFilter';
import HeroSlider from '../components/common/HeroSlider';
import '../styles/Home.css'; 

const Home = () => {
  // 1. Initialize from Session Storage (Instant View)
  const [allProducts, setAllProducts] = useState(() => {
    const cached = sessionStorage.getItem('nk_home_products');
    return cached ? JSON.parse(cached) : [];
  });

  const [displayedProducts, setDisplayedProducts] = useState(() => {
    const cached = sessionStorage.getItem('nk_home_products');
    return cached ? JSON.parse(cached) : [];
  });

  // Only show big loader if cache is completely empty
  const [loading, setLoading] = useState(() => {
    return !sessionStorage.getItem('nk_home_products');
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [sortOption, setSortOption] = useState('newest');

  // 2. Restore Scroll Position
  useLayoutEffect(() => {
    const savedScroll = sessionStorage.getItem('nk_home_scroll');
    if (savedScroll && allProducts.length > 0) {
      window.scrollTo(0, parseInt(savedScroll));
    }
  }, []);

  // 3. FETCH DATA (THE FIX: Remove blocking check, run always on mount)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Query Database
        const querySnapshot = await getDocs(collection(db, "products_collection"));
        const productsList = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        
        if (productsList.length > 0) {
          // Compare with current state to avoid unnecessary renders/scroll jumps
          // Simple length check + ID check or just overwriting (safest to overwrite for new pricing)
          setAllProducts(productsList);
          
          // Only force update the Display list if the user hasn't started filtering yet
          // or if the list was empty
          if ((!searchTerm && category === 'All') || displayedProducts.length === 0) {
            setDisplayedProducts(productsList);
          }
          
          // Update Cache with fresh data
          sessionStorage.setItem('nk_home_products', JSON.stringify(productsList));
        }
      } catch (error) {
        console.error("DB Error", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    // Dependency array is empty [], so this runs ONCE every time you visit the page,
    // ensuring you always get the latest products.
  }, []);

  // 4. Scroll Tracking
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('nk_home_scroll', window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 5. Filtering Logic
  useEffect(() => {
    if (allProducts.length === 0) return;

    let result = [...allProducts];

    // Category Filter
    if (category !== 'All') {
      result = result.filter(p => p.category?.toLowerCase() === category.toLowerCase());
    }

    // Search Filter
    if (searchTerm.trim() !== '') {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(lowerTerm) || 
        p.description?.toLowerCase().includes(lowerTerm)
      );
    }

    // Sorting
    if (sortOption === 'price_low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price_high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'newest') {
      // Assuming 'createdAt' or basic array order usually suffices if no date field
      // You can add logic here if you store createdAt in addProduct
    }
    
    setDisplayedProducts(result);
  }, [allProducts, searchTerm, category, sortOption]);

  return (
    <div className="container">
      <HeroSlider onCategorySelect={setCategory} />
      
      <div id="shop-section">
        <h2 className="section-title">Latest Collection</h2>
        
        <SearchFilter 
          onSearch={setSearchTerm} 
          onCategoryChange={setCategory}
          onSortChange={setSortOption}
          activeCategory={category}
          activeSort={sortOption}
        />

        {/* LOADING STATE */}
        {loading ? (
          <div style={{ padding:'50px', textAlign:'center', color:'#64748b' }}>
             Loading products...
          </div>
        ) : displayedProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <h3>No products found</h3>
            <p>We couldn't find matches for your filters. Try browsing all categories.</p>
            <button className="btn secondary" onClick={() => {setCategory('All'); setSearchTerm('');}}>Clear Filters</button>
          </div>
        ) : (
          /* PRODUCT GRID */
          <div className="product-grid">
            {displayedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;