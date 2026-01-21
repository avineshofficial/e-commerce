import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, deleteDoc, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [wishlistIDs, setWishlistIDs] = useState(new Set()); // For fast checking (hasItem)

  useEffect(() => {
    let unsubscribe;

    if (currentUser) {
      // Real-time listener for the user's wishlist sub-collection
      const wishlistRef = collection(db, `users_collection/${currentUser.uid}/wishlist`);
      
      unsubscribe = onSnapshot(wishlistRef, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWishlist(items);
        
        // Create a Set of IDs for instant "Heart Icon" toggling status
        setWishlistIDs(new Set(items.map(item => item.id)));
      }, (error) => {
        console.error("Wishlist Sync Error:", error);
      });
    } else {
      setWishlist([]);
      setWishlistIDs(new Set());
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // Toggle Function: If exists, remove it. If not, add it.
  const toggleWishlist = async (product) => {
    if (!currentUser) {
      alert("Please login to save items to your wishlist.");
      return;
    }

    const docRef = doc(db, `users_collection/${currentUser.uid}/wishlist`, product.id);

    if (wishlistIDs.has(product.id)) {
      // Remove
      try {
        await deleteDoc(docRef);
      } catch (err) { console.error("Remove failed", err); }
    } else {
      // Add
      try {
        await setDoc(docRef, {
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          addedAt: new Date()
        });
      } catch (err) { console.error("Add failed", err); }
    }
  };

  // Check if a specific product is in wishlist
  const isInWishlist = (productId) => wishlistIDs.has(productId);

  const value = {
    wishlist,
    toggleWishlist,
    isInWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};