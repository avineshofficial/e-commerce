import React, { createContext, useState, useEffect, useContext, useCallback } from 'react'; // Added useCallback
import { auth, db } from '../config/firebase'; 
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL?.toLowerCase().trim();

  // FIX: Wrap in useCallback to satisfy dependency warning
  const fetchUserRole = useCallback(async (user) => {
    if (!user) {
        setUserRole(null);
        return;
    }
    
    if (user.email.toLowerCase() === ADMIN_EMAIL) {
        setUserRole('admin');
        return;
    }

    try {
        const docRef = doc(db, "users_collection", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().role) {
            setUserRole(docSnap.data().role);
        } else {
            setUserRole('user');
        }
    } catch (e) {
        console.error("Role Fetch Error", e);
        setUserRole('user');
    }
  }, [ADMIN_EMAIL]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      await fetchUserRole(user);
      setLoading(false);
    });
    return unsubscribe;
  }, [fetchUserRole]); // FIX: Added dependency

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
      }, { merge: true });
      
      await fetchUserRole(user);
      return user;
    } catch (error) { throw error; }
  };

  const logout = () => signOut(auth);

  const value = { currentUser, userRole, googleSignIn, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};