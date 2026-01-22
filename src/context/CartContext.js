import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const FREE_SHIPPING_THRESHOLD = 499;
  const SHIPPING_CHARGE = 40;

  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('nk_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) { return []; }
  });

  useEffect(() => {
    localStorage.setItem('nk_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      
      // Get the correct stock limit from the product object
      const stockLimit = product.stock !== undefined ? product.stock : (product.stock_quantity || 100);

      if (existing) {
        if(existing.quantity >= stockLimit) {
            // Optional: alert or toast here via a callback if needed
            return prev; 
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, stock: stockLimit }];
    });
  };

  const removeFromCart = (id) => setCartItems(prev => prev.filter(item => item.id !== id));

  // --- FIX: CHECK STOCK LIMIT HERE ---
  const updateQuantity = (id, newQty) => {
    if (newQty < 1) return;

    setCartItems(prev => prev.map(item => {
        if (item.id === id) {
            // Use stored stock value, default high if missing
            const limit = item.stock !== undefined ? item.stock : (item.stock_quantity || 100);
            
            // Prevent increasing beyond stock
            if (newQty > limit) {
                // Just return the item as is (no change)
                return item; 
            }
            return { ...item, quantity: newQty };
        }
        return item;
    }));
  };

  const clearCart = () => setCartItems([]);

  const cartSubtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const shippingCost = (cartSubtotal >= FREE_SHIPPING_THRESHOLD || cartSubtotal === 0) ? 0 : SHIPPING_CHARGE;
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