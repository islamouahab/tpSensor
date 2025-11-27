import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig"; // Firestore
import { rtdb } from "../firebaseConfig"; // Realtime Database
import { collection, getDocs } from "firebase/firestore";
import { ref, set } from "firebase/database";
import "../sensor.css";

const AutoTemperatureSender = () => {
  const [centers, setCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState("");

  const generateRandomTemp = () =>
    Math.floor(Math.random() * (26 - 23 + 1)) + 23;
  const generateRandomHumidity = () =>
    Math.floor(Math.random() * (76 - 66 + 1)) + 66;

  // ✅ Fetch locations from Firestore
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const centersSnapshot = await getDocs(collection(db, "centers"));
        const centersArray = centersSnapshot.docs.map((doc) => ({
          id: doc.id,
          location: doc.data().location,
        }));
        setCenters(centersArray);
      } catch (err) {
        console.error("Error fetching centers:", err);
      }
    };
    fetchCenters();
  }, []);

  useEffect(() => {
    if (!selectedCenter) return;

    const sendTemperature = async () => {
      const temp = generateRandomTemp();
      const humidity = generateRandomHumidity();

      try {
        await set(ref(rtdb, `userTemps/${selectedCenter}/temp`), temp);
        await set(ref(rtdb, `userHumidity/${selectedCenter}/humidity`), humidity);
        console.log(
          `Sent to ${selectedCenter}: temp ${temp}°C, humidity ${humidity}%`
        );
      } catch (err) {
        console.error("Realtime DB write error:", err);
      }
    };

    const interval = setInterval(sendTemperature, 2000);
    return () => clearInterval(interval);
  }, [selectedCenter]);

  return (
    <div className="sensor-page">
      <h2>Auto Temperature Sender</h2>

      <label htmlFor="centerSelect">Select Location:</label>
      <select
        id="centerSelect"
        value={selectedCenter}
        onChange={(e) => setSelectedCenter(e.target.value)}
      >
        <option value="">-- Select a location --</option>
        {centers.map((center) => (
          <option key={center.id} value={center.id}>
            {center.location}
          </option>
        ))}
      </select>

      {selectedCenter ? (
        <p>
          Sending temperature/humidity to{" "}
          <strong>{selectedCenter}</strong> every 2s...
        </p>
      ) : (
        <p>Please select a location to start sending data.</p>
      )}
    </div>
  );
};

export default AutoTemperatureSender;
