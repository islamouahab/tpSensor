import React, { useState, useEffect } from "react";
import { auth, rtdb, db } from "../firebaseConfig";
import { collection, addDoc, doc, setDoc, getDoc, getDocs } from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";


import { ref, set, get } from "firebase/database";

import "../client.css";

const AdminPage = () => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("Please log in...");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [centers, setCenters] = useState([]);
  const [newCenterName, setNewCenterName] = useState("");
  const [threshold, setThreshold] = useState(25);

  // --- Authentication ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus("Signing in...");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setStatus("Login successful!");
    } catch (err) {
      setStatus("Login failed: " + err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setStatus("Signed out.");
    } catch (err) {
      console.error("Sign-out failed:", err);
    }
  };

  // --- Fetch Centers ---
  const fetchCenters = async () => {
    try {
      const centersRef = collection(db, "centers");
      const snapshot = await getDocs(centersRef);
      const arr = snapshot.docs.map((doc) => ({
        id: doc.id,
        location: doc.data().location,
      }));
      setCenters(arr);
    } catch (err) {
      console.error("Error fetching centers:", err);
    }
  };

  // --- Add New Center ---
  const handleAddCenter = async () => {
    if (!newCenterName.trim()) return;

    try {
      // Add to Firestore
      const docRef = await addDoc(collection(db, "centers"), {
        location: newCenterName,
      });

      // Add default data to RTDB
      await set(ref(rtdb, `userTemps/${docRef.id}/temp`), 0);
      await set(ref(rtdb, `userHumidity/${docRef.id}/humidity`), 0);

      setNewCenterName("");
      fetchCenters();
      alert("Center added successfully!");
    } catch (err) {
      console.error("Error adding center:", err);
    }
  };

  // --- Load Threshold ---
  const loadThreshold = async () => {
    const docRef = doc(db, "settings", "threshold");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setThreshold(docSnap.data().value);
    }
  };

  // --- Save Threshold ---
  const saveThreshold = async () => {
    try {
      await setDoc(doc(db, "settings", "threshold"), { value: threshold });
      alert("Threshold updated!");
    } catch (err) {
      console.error("Error updating threshold:", err);
    }
  };

  // --- Listen Auth State ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setStatus("Connected. Admin Dashboard ready.");
        fetchCenters();
        loadThreshold();
      } else {
        setStatus("Please log in...");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="main-container">
      <h2 className="title">Admin Dashboard</h2>
      <div className="status">{status}</div>

      {!user ? (
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Sign In</button>
        </form>
      ) : (
        <>
          <button onClick={handleSignOut} className="signout-btn">
            Sign Out
          </button>

          <div className="admin-section">
            <h3>Add New Center</h3>
            <input
              type="text"
              placeholder="Center Name"
              value={newCenterName}
              onChange={(e) => setNewCenterName(e.target.value)}
            />
            <button onClick={handleAddCenter}>Add Center</button>
          </div>

          <div className="admin-section">
            <h3>Temperature Threshold</h3>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
            />
            <button onClick={saveThreshold}>Save Threshold</button>
          </div>

          <div className="admin-section">
            <h3>All Centers</h3>
            <ul>
              {centers.map((center) => (
                <li key={center.id}>{center.location}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPage;
