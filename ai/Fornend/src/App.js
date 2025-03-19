import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from "react-router-dom";
import Home from "./Home";
import HumidityTemperatureChart from "./HumidityTemperatureChart";
import GasChart from "./GasChart";
import Login from "./Login";
import { useTheme } from "./ThemeContext";
import "./App.css";
import AdminDashboard from "./AdminDashboard";

function App() {
  const { isLightMode, toggleTheme } = useTheme();
  const [loggedIn, setLoggedIn] = useState(false); // Manage login state

  const ProtectedRoute = ({ children }) => {
    return loggedIn ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div
        className={`app-container ${isLightMode ? "light-mode" : "dark-mode"}`}
      >
        <h1 className="app-title">Sensor Data Monitor</h1>
        <div className="theme-toggle-container">
          <button onClick={toggleTheme} className="theme-toggle-button">
            Switch to {isLightMode ? "Dark" : "Light"} Mode
          </button>
        </div>

        <nav className="nav-container">
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/humidity-temperature" className="nav-link">
            Humidity and Temperature
          </Link>
          <Link to="/gas-chart" className="nav-link">
            Gas Data
          </Link>
        </nav>

        <Routes>
          <Route path="/login" element={<Login setLoggedIn={setLoggedIn} />} />
          <Route path="/" element={<Home />} />
          <Route
            path="/humidity-temperature"
            element={
              <ProtectedRoute>
                <HumidityTemperatureChart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gas-chart"
            element={
              <ProtectedRoute>
                <GasChart />
              </ProtectedRoute>
            }
          />
            <Route path="/admin-dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
