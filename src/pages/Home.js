import React, { useEffect, useState, useLayoutEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import ProductCard from '../components/products/ProductCard';
import SearchFilter from '../components/common/SearchFilter';
import HeroSlider from '../components/common/HeroSlider';
import Loader from '../components/common/Loader'; // Use existing loader if available, or just div
import '../styles/Home.css'; 

const Home = () => {
  // 1. LAZY INIT (Instant Load from Cache)
  const [allProducts, setAllProducts] = useState(() => {
    try {
      const cached = sessionStorage.getItem('nk_home_products');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });

  const [displayedProducts, setDisplayedProducts] = useState(() => {
    try {
      const cached = sessionStorage.getItem('nk_home_products');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });

  const [loading, setLoading] = useState(() => !sessionStorage.getItem('nk_home_products'));

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [sortOption, setSortOption] = useState('newest');

  // 2. SCROLL RESTORATION
  useLayoutEffect(() => {
    const savedScroll = sessionStorage.getItem('nk_home_scroll');
    if (savedScroll && allProducts.length > 0) {
      window.scrollTo(0, parseInt(savedScroll));
    }
  }, []);

  // 3. FETCH DATA (Background Refresh)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products_collection"));
        const productsList = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        
        if (productsList.length > 0) {
          // Compare JSON strings to avoid unnecessary re-renders/loop if data is identical
          const currentStr = JSON.stringify(allProducts);
          const newStr = JSON.stringify(productsList);

          if (currentStr !== newStr) {
            setAllProducts(productsList);
            sessionStorage.setItem('nk_home_products', newStr);
            
            // Initial Set Only
            if ((!searchTerm && category === 'All') || displayedProducts.length === 0) {
              setDisplayedProducts(productsList);
            }
          }
        }
      } catch (error) {
        console.error("DB Error", error);
      } finally {
        setLoading(false);
      }
    };
    
    // Always fetch on mount to get latest stock/price updates
    fetchProducts();
  }, []);

  // 4. Save Scroll
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('nk_home_scroll', window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 5. SMART FILTERING LOGIC
  useEffect(() => {
    if (allProducts.length === 0) return;

    let result = [...allProducts];

    // A. Filter Category
    if (category !== 'All') {
      result = result.filter(p => p.category?.toLowerCase() === category.toLowerCase());
    }

    // B. Smart Search (Token-based matching)
    if (searchTerm.trim() !== '') {
      // Split search "Coconut Oil" -> ["coconut", "oil"]
      const tokens = searchTerm.toLowerCase().split(/\s+/).filter(t => t.length > 0);
      
      result = result.filter(p => {
        // Create a giant string of all product text
        const productSearchString = `
          ${p.name || ''} 
          ${p.category || ''} 
          ${p.description || ''} 
          ${p.variants?.map(v => v.unit).join(' ') || ''}
        `.toLowerCase();

        // CHECK: Does the product contain ALL words typed by user?
        // E.g. User types "1kg oil". It checks if "1kg" is in product AND "oil" is in product.
        return tokens.every(token => productSearchString.includes(token));
      });
    }

    // C. Sorting
    if (sortOption === 'price_low') {
      // Sort by the 'displayed' price (handling variations)
      result.sort((a, b) => {
        const pA = a.price; // or calculate min variant price
        const pB = b.price;
        return pA - pB;
      });
    } else if (sortOption === 'price_high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'newest') {
        // If you have a createdAt field:
        // result.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }
    
    setDisplayedProducts(result);
  }, [allProducts, searchTerm, category, sortOption]);

  return (
    <div className="container">
      
      {/* Slider updates category automatically */}
      <HeroSlider onCategorySelect={setCategory} />
      
      <div id="shop-section">
        <h2 className="section-title">Latest Collection</h2>
        
        {/* Search Bar */}
        <SearchFilter 
          onSearch={setSearchTerm} 
          onCategoryChange={setCategory}
          onSortChange={setSortOption}
          activeCategory={category}
          activeSort={sortOption}
        />

        {loading && allProducts.length === 0 ? (
          <div style={{ padding:'50px', textAlign:'center', color:'#64748b' }}>
             {/* If you have the Loader component import it, else basic text */}
             Loading Products...
          </div>
        ) : displayedProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <h3>No products found</h3>
            <p>We couldn't find items matching "<strong>{searchTerm}</strong>" in {category !== 'All' ? category : 'store'}.</p>
            <button className="btn secondary" onClick={() => {setCategory('All'); setSearchTerm('');}}>Clear Filters</button>
          </div>
        ) : (
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