import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { FaSearch, FaFilter, FaSortAmountDown } from 'react-icons/fa';

const SearchFilter = ({ onSearch, onCategoryChange, onSortChange, activeCategory, activeSort }) => {
  const [categories, setCategories] = useState([]);

  // Fetch Categories from Database
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const snap = await getDocs(collection(db, "categories"));
        const list = snap.docs.map(doc => doc.data());
        // Only set if data exists
        if (list.length > 0) setCategories(list);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCats();
  }, []);

  return (
    <div className="search-filter-container" style={styles.container}>
      
      {/* 1. Search Bar */}
      <div style={styles.searchWrapper} className="search-box">
        <FaSearch style={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Search products..." 
          onChange={(e) => onSearch(e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={styles.controlsWrapper}>
        {/* 2. Category Filter - FIXED: No Hardcoded Defaults */}
        <div style={styles.selectWrapper}>
          <FaFilter style={styles.icon} />
          <select 
            value={activeCategory} 
            onChange={(e) => onCategoryChange(e.target.value)}
            style={styles.select}
          >
            <option value="All">All Categories</option>
            {categories
                .filter(cat => cat.isActive !== false) // Only show active
                .map((cat, index) => (
                  <option key={index} value={cat.value}>{cat.name}</option>
              ))
            }
          </select>
        </div>

        {/* 3. Sort By */}
        <div style={styles.selectWrapper}>
          <FaSortAmountDown style={styles.icon} />
          <select 
            value={activeSort} 
            onChange={(e) => onSortChange(e.target.value)}
            style={styles.select}
          >
            <option value="newest">Newest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Internal CSS */}
      <style>{`
        /* Focus Outline Fixes */
        .search-box input:focus { outline: none; box-shadow: none; }
        .search-box:focus-within {
          border-color: var(--primary-color) !important;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        @media (max-width: 768px) {
          .search-filter-container { flex-direction: column; gap: 15px; }
          .controlsWrapper { width: 100%; justify-content: space-between; }
        }
      `}</style>
    </div>
  );
};

// ... Keep existing styles const object below as is ...
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    background: 'white',
    padding: '15px 20px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    marginBottom: '30px',
    border: '1px solid #f3f4f6'
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    background: '#f8fafc',
    borderRadius: '8px',
    padding: '0 15px',
    border: '2px solid #f1f5f9',
    flex: 1,
    maxWidth: '500px',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  },
  searchIcon: { color: '#94a3b8' },
  input: {
    border: 'none',
    background: 'transparent',
    padding: '12px',
    width: '100%',
    outline: 'none',
    fontSize: '0.95rem',
    color: '#334155',
    margin: 0
  },
  controlsWrapper: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
  selectWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  icon: { position: 'absolute', left: '12px', color: 'var(--primary-color)', pointerEvents: 'none', zIndex: 1 },
  select: {
    padding: '10px 10px 10px 38px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: '#fff',
    cursor: 'pointer',
    outline: 'none',
    fontSize: '0.9rem',
    color: '#475569',
    fontWeight: '500',
    margin: 0,
    minWidth: '160px'
  }
};

export default SearchFilter;