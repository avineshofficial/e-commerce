import React, { useState, useEffect } from 'react';
// 1. Import Context Hook instead of firebase direct calls
import { useProducts } from '../context/ProductContext';
import ProductCard from '../components/products/ProductCard';
import SearchFilter from '../components/common/SearchFilter';
import HeroSlider from '../components/common/HeroSlider';
import Loader from '../components/common/Loader';
import '../styles/Home.css'; 

const Home = () => {
  // 2. GET DATA FROM GLOBAL CONTEXT (Instant Access/Cache)
  const { products, loading } = useProducts(); 
  
  const [displayedProducts, setDisplayedProducts] = useState([]);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [sortOption, setSortOption] = useState('newest');

  // 3. Sync local state when context data loads
  useEffect(() => {
    setDisplayedProducts(products);
  }, [products]);

  // 4. FILTERING & SORTING LOGIC
  useEffect(() => {
    // If no data yet, do nothing
    if (!products || products.length === 0) return;

    let result = [...products];

    // A. Filter by Category
    if (category !== 'All') {
      result = result.filter(p => p.category?.toLowerCase() === category.toLowerCase());
    }

    // B. Smart Search (Token-based)
    if (searchTerm.trim() !== '') {
      const tokens = searchTerm.toLowerCase().split(/\s+/).filter(t => t.length > 0);
      result = result.filter(p => {
        // Search in Name, Category, Description, and Variant Sizes
        const text = `${p.name} ${p.category} ${p.description} ${p.variants?.map(v=>v.unit).join(' ')}`.toLowerCase();
        // Return true only if ALL tokens match
        return tokens.every(token => text.includes(token));
      });
    }

    // C. Sorting
    if (sortOption === 'price_low') {
      // Sort based on effective price (handling discount/variants if logic exists in ProductCard)
      // Simple sorting on base price property here for speed
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price_high') {
      result.sort((a, b) => b.price - a.price);
    } 
    // 'newest' usually relies on default order from DB (by createdAt), or you can sort by timestamp if available.

    setDisplayedProducts(result);
  }, [products, searchTerm, category, sortOption]);

  // Loading Screen (Only appears on very first load)
  if (loading) return <Loader text="Loading Collection..." />;

  return (
    <div className="container">
      {/* Slider: Pass setter to control filters */}
      <HeroSlider onCategorySelect={setCategory} />
      
      <div id="shop-section">
        <h2 className="section-title">Latest Collection</h2>
        
        {/* Search & Filter Bar */}
        <SearchFilter 
          onSearch={setSearchTerm} 
          onCategoryChange={setCategory}
          onSortChange={setSortOption}
          activeCategory={category}
          activeSort={sortOption}
        />

        {/* Results Grid */}
        {displayedProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <h3>No products found</h3>
            <p>We couldn't find matches for "<strong>{searchTerm || category}</strong>".</p>
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