import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// 1. Private User Route (Protects Checkout, Profile, Orders)
// Checks if the user is simply logged in.
export const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // If not logged in, send to login page
    return <Navigate to="/login" replace />;
  }

  return children;
};

// 2. Admin & Staff Route (Protects Dashboard, Inventory, etc.)
// Checks if the user has specific privileges ('admin' or 'staff').
export const AdminRoute = ({ children }) => {
  const { currentUser, userRole } = useAuth(); // Get role from Context

  // If not logged in at all, go to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // ALLOW Access: If role is 'admin' (Owner) OR 'staff' (Employee)
  if (userRole === 'admin' || userRole === 'staff') {
    return children;
  }

  // DENY Access: Logged in users who are NOT admin/staff get sent to Home
  return <Navigate to="/" replace />;
};