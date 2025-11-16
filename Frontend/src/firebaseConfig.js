// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDI48i3W1op63KMGHK6cjHDeFMH3y9QNaU",
  authDomain: "freeflix-45feb.firebaseapp.com",
  projectId: "freeflix-45feb",
  storageBucket: "freeflix-45feb.appspot.com",
  messagingSenderId: "154261774339",
  appId: "1:154261774339:web:4c7946a303e36efdbdee36",
  measurementId: "G-XK59YZ7CL0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export default app;
