import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  // Config
  const FREE_SHIPPING_THRESHOLD = 499;
  const SHIPPING_CHARGE = 40;

  // FIX: Lazy Initialization
  // We read from localStorage IMMEDIATELY when the app starts.
  // This prevents the empty [] state from overwriting your saved data.
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('nk_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Error loading cart:", error);
      return [];
    }
  });

  // Save to LocalStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('nk_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems(prev => {
      // Logic for variants: check IDs match
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if(existing.quantity >= (product.stock || 99)) return prev; 
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => setCartItems(prev => prev.filter(item => item.id !== id));

  const updateQuantity = (id, newQty) => {
    if (newQty < 1) return;
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item));
  };

  const clearCart = () => setCartItems([]);

  // --- CALCULATIONS ---
  const cartSubtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Shipping logic
  const shippingCost = (cartSubtotal >= FREE_SHIPPING_THRESHOLD || cartSubtotal === 0) ? 0 : SHIPPING_CHARGE;

  // Grand Total
  const totalAmount = cartSubtotal + shippingCost;

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartSubtotal, 
    shippingCost,
    totalAmount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};