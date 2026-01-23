import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
  // 1. INITIALIZE STATE FROM CACHE (For instant page load)
  const [products, setProducts] = useState(() => {
    try {
      const cached = sessionStorage.getItem('nk_cache_products');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });

  const [categories, setCategories] = useState(() => {
    try {
      const cached = sessionStorage.getItem('nk_cache_categories');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });

  const [loading, setLoading] = useState(!products.length); // Only show spinner if cache is empty

  // 2. FETCH FUNCTION
  const fetchFromDatabase = async () => {
    try {
      // console.log("🔄 Background syncing with Database...");

      // A. Fetch Products
      const prodSnap = await getDocs(collection(db, "products_collection"));
      const prodList = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // B. Fetch Categories
      const catSnap = await getDocs(collection(db, "categories"));
      const catList = catSnap.docs.map(doc => doc.data());

      // 3. COMPARE AND UPDATE (Prevents unnecessary re-renders if data matches)
      // We convert to string to do a quick check if data actually changed
      const currentProdStr = sessionStorage.getItem('nk_cache_products');
      const newProdStr = JSON.stringify(prodList);
      
      const currentCatStr = sessionStorage.getItem('nk_cache_categories');
      const newCatStr = JSON.stringify(catList);

      // Only update State/DOM if the data is actually different from cache
      if (currentProdStr !== newProdStr) {
        setProducts(prodList);
        sessionStorage.setItem('nk_cache_products', newProdStr);
      }

      if (currentCatStr !== newCatStr) {
        setCategories(catList);
        sessionStorage.setItem('nk_cache_categories', newCatStr);
      }

    } catch (error) {
      console.error("Data Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 4. ALWAYS FETCH ON MOUNT
    // Even if we have cache, we fetch in background to ensure data is fresh (e.g. after a refresh)
    fetchFromDatabase();
    
    // eslint-disable-next-line
  }, []);

  const forceRefresh = () => {
    setLoading(true);
    fetchFromDatabase();
  };

  return (
    <ProductContext.Provider value={{ products, categories, loading, forceRefresh }}>
      {children}
    </ProductContext.Provider>
  );
};