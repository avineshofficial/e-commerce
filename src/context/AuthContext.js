import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../config/firebase'; 
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // New: Track Role
  const [loading, setLoading] = useState(true);

  const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL?.toLowerCase().trim();

  // Helper to fetch role
  const fetchUserRole = async (user) => {
    if (!user) {
        setUserRole(null);
        return;
    }
    
    // 1. Super Admin Bypass (Always Admin)
    if (user.email.toLowerCase() === ADMIN_EMAIL) {
        setUserRole('admin');
        return;
    }

    // 2. Fetch from DB
    try {
        const docRef = doc(db, "users_collection", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().role) {
            setUserRole(docSnap.data().role); // 'staff' or 'admin'
        } else {
            setUserRole('user');
        }
    } catch (e) {
        console.error("Role Fetch Error", e);
        setUserRole('user');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      await fetchUserRole(user); // Get role immediately
      setLoading(false);
    });
    return unsubscribe;
  }, [ADMIN_EMAIL]);

  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users_collection", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLogin: serverTimestamp(),
      }, { merge: true }); // We merge so we don't overwrite existing 'role' field
      
      await fetchUserRole(user); // Update role in state
      return user;
    } catch (error) { throw error; }
  };

  const logout = () => signOut(auth);

  const value = {
    currentUser,
    userRole, // Export role
    googleSignIn,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};