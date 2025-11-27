import React, { useEffect, useState } from "react";
import { auth, rtdb, db } from "../firebaseConfig";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { ref, onValue } from "firebase/database";
import { collection, getDocs , doc , getDoc } from "firebase/firestore";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import "../client.css";

const TemperatureViewer = () => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("Please log in...");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [centers, setCenters] = useState([]); // All centers
  const [sensorData, setSensorData] = useState({});
  const [threshold , setThreshold] = useState(25); // Temp/humidity/graph per center
  
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
  useEffect(() => {
  const fetchThreshold = async () => {
    try {
      const docRef = doc(db, "settings", "threshold");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data) {
          setThreshold(data);
        }
      }
    } catch (err) {
      console.error("Error fetching threshold:", err);
    }
  };
  fetchThreshold();
}, []);
  // Fetch centers from Firestore
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const snap = await getDocs(collection(db, "centers"));
        const arr = snap.docs.map((doc) => ({
          id: doc.id,
          location: doc.data().location,
        }));
        setCenters(arr);
      } catch (err) {
        console.error("Error fetching centers:", err);
      }
    };
    fetchCenters();
  }, []);

  // Listen to RTDB for ALL centers
  useEffect(() => {
    if (!centers.length) return;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setStatus("Please log in...");
        return;
      }

      setStatus("Connected. Listening to all centers…");

      centers.forEach((center) => {
        const tempRef = ref(rtdb, `userTemps/${center.id}/temp`);
        const humidityRef = ref(rtdb, `userHumidity/${center.id}/humidity`);

        // Listen to temp
        onValue(tempRef, (snap) => {
          const tempValue = snap.val();
          if (tempValue === null) return;

          setSensorData((prev) => {
            const prevCenter = prev[center.id] || { graph: [] };

            const timestamp = new Date().toLocaleTimeString();
            const newGraph = [...prevCenter.graph, { time: timestamp, temp: tempValue }].slice(-20);

            return {
              ...prev,
              [center.id]: {
                ...prevCenter,
                temp: tempValue,
                graph: newGraph,
              },
            };
          });
        });

        // Listen to humidity
        onValue(humidityRef, (snap) => {
          const humValue = snap.val();
          if (humValue === null) return;

          setSensorData((prev) => {
            const prevCenter = prev[center.id] || {};

            return {
              ...prev,
              [center.id]: {
                ...prevCenter,
                humidity: humValue,
              },
            };
          });
        });
      });
    });

    return () => unsubscribe();
  }, [centers]);

  return (
    <div className="main-container">

      <h2 className="title">Temperature Viewer</h2>
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

          <div className="grid-container">
            {centers.map((center) => {
              const data = sensorData[center.id] || {};
              return (
                <div key={center.id} className="sensor-card">
                  <h3>{center.location}</h3>

                  {/* Temperature graph */}
                  {data.graph && data.graph.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={data.graph}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="temp"
                          stroke="#ff3333"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p>No data yet...</p>
                  )}

                  {/* Current Temp */}
                  <p
                    className="temp-value"
                    style={{
                      color: data.temp >= threshold ? "red" : "darkblue",
                    }}
                  >
                    Temp: {data.temp ?? "—"} °C
                  </p>

                  {/* Current Humidity */}
                  <p className="humidity-value">
                    Humidity: {data.humidity ?? "—"} %
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default TemperatureViewer;
