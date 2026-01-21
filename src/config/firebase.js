import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB0kI9T8TH5zfFF4TGhHhGLFUtWewaouVw",
  authDomain: "nksenterprises-269c4.firebaseapp.com",
  projectId: "nksenterprises-269c4",
  storageBucket: "nksenterprises-269c4.firebasestorage.app",
  messagingSenderId: "297015217731",
  appId: "1:297015217731:web:ccd9452c853df71da80ef6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);