import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to actually fetch from Firebase
  const fetchFromDatabase = async () => {
    setLoading(true);
    try {
      console.log("🔥 FETCHING DATA FROM FIREBASE (Reads Configured)...");

      // 1. Fetch Products
      const prodSnap = await getDocs(collection(db, "products_collection"));
      const prodList = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 2. Fetch Categories
      const catSnap = await getDocs(collection(db, "categories"));
      const catList = catSnap.docs.map(doc => doc.data());

      // 3. Update State & Save to Session Cache
      setProducts(prodList);
      setCategories(catList);
      
      // Store in browser memory (clears when tab closes)
      sessionStorage.setItem('nk_cache_products', JSON.stringify(prodList));
      sessionStorage.setItem('nk_cache_categories', JSON.stringify(catList));
      sessionStorage.setItem('nk_cache_time', Date.now().toString());

    } catch (error) {
      console.error("Data Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Check if we have data in memory
    const cachedProds = sessionStorage.getItem('nk_cache_products');
    const cachedCats = sessionStorage.getItem('nk_cache_categories');

    if (cachedProds && cachedCats) {
      console.log("⚡ LOADED FROM LOCAL CACHE (No Reads)");
      setProducts(JSON.parse(cachedProds));
      setCategories(JSON.parse(cachedCats));
      setLoading(false);
    } else {
      // 2. If no cache, fetch from DB
      fetchFromDatabase();
    }
  }, []);

  // Use this function in Admin actions to force an update after editing
  const forceRefresh = () => {
    sessionStorage.removeItem('nk_cache_products');
    fetchFromDatabase();
  };

  return (
    <ProductContext.Provider value={{ products, categories, loading, forceRefresh }}>
      {children}
    </ProductContext.Provider>
  );
};