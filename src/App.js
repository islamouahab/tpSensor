import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AutoTemperatureSender from "./components/AutoTemperatureSender";
import TemperatureViewer from "./components/TemperatureViewer";
import AdminPage from "./components/AdminPage";

function App() {
  return (
    <Router>
      <nav style={{ textAlign: "center", margin: "20px" }}>
        <Link to="/" style={{ marginRight: "20px" }}>
          Auto Sender
        </Link>
        <Link to="/viewer">Temperature Viewer</Link>
        <Link to="/admin">Temperature Viewer</Link>
      </nav>

      <Routes>
        <Route path="/" element={<AutoTemperatureSender />} />
        <Route path="/viewer" element={<TemperatureViewer />} />
         <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}

export default App;
