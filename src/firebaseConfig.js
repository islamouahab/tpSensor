// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD37c8kwU3EExKEOzEjNcc9iwgIgv1ZvMA",
  authDomain: "tempdetection-ed171.firebaseapp.com",
  databaseURL: "https://tempdetection-ed171-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tempdetection-ed171",
  storageBucket: "tempdetection-ed171.firebasestorage.app",
  messagingSenderId: "887778060045",
  appId: "1:887778060045:web:c405e7506ec905f012f244",
  measurementId: "G-QLRVJBG1WS"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); 
export const rtdb = getDatabase(app);
export const auth = getAuth(app);
