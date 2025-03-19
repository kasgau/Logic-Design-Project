import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useTheme } from "./ThemeContext";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const socket = io("http://127.0.0.1:5000");

function HumidityTemperatureChart() {
  const { isLightMode } = useTheme();
  const [chartData, setChartData] = useState([]);
  const [predictionDate, setPredictionDate] = useState("");
  const [predictionResult, setPredictionResult] = useState("");

  // Fetch all data on initial load
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:5000/all-data");
        const allData = response.data;

        // Map and format the data
        const formattedData = allData.map((entry) => ({
          ...entry.dht,
          timestamp: new Date(entry.timestamp).toLocaleTimeString(),
        }));

        setChartData(formattedData);
      } catch (error) {
        console.error("Error fetching all data:", error);
      }
    };

    fetchAllData();
  }, []);

  // Fetch the latest data periodically
  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:5000/latest-data");
        const { dht } = response.data;

        if (dht) {
          const updatedData = {
            ...dht,
            timestamp: new Date().toLocaleTimeString(),
          };

          setChartData((prevData) => [...prevData, updatedData]);

          if (dht.temperatureC > 50) {
            alert("Warning: Current temperature exceeds 50°C!");
          }
        }
      } catch (error) {
        console.error("Error fetching latest data:", error);
      }
    };

    const interval = setInterval(fetchLatestData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Listen for temperature alerts from the server
// Listen for temperature alerts periodically
useEffect(() => {
  const checkTemperatureAlert = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/temperature-alert");
      if (response.data.alert) {
        alert(response.data.alert); // Display the alert
      }
    } catch (error) {
      console.error("Error checking temperature alert:", error);
    }
  };

  const interval = setInterval(checkTemperatureAlert, 2000); // Check every 2 seconds
  return () => clearInterval(interval); // Cleanup on component unmount
}, []);

  const handlePrediction = async () => {
    if (!predictionDate) {
      alert("Please select a date for prediction.");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:5000/predict", {
        date: predictionDate,
      });
      const { predicted_humidity, predicted_temperature } = response.data;

      setPredictionResult(
        `Predicted Humidity: ${predicted_humidity.toFixed(2)}% | Predicted Temperature: ${predicted_temperature.toFixed(
          2
        )}°C`
      );
    } catch (error) {
      console.error("Prediction error:", error);
      alert("Failed to fetch prediction. Please try again.");
    }
  };

  return (
    <div
      style={{
        backgroundColor: isLightMode ? "#ffffff" : "#2c2c2c",
        color: isLightMode ? "#000000" : "#ffffff",
        padding: "20px",
        borderRadius: "10px",
      }}
    >
      <h2>Humidity and Temperature Chart</h2>

      <div style={{ marginBottom: "20px" }}>
        <label>
          Select a Date for Prediction:{" "}
          <input
            type="date"
            value={predictionDate}
            onChange={(e) => setPredictionDate(e.target.value)}
            style={{
              padding: "5px",
              borderRadius: "5px",
              border: isLightMode ? "1px solid #000" : "1px solid #fff",
              backgroundColor: isLightMode ? "#fff" : "#444",
              color: isLightMode ? "#000" : "#fff",
            }}
          />
        </label>
        <button
          onClick={handlePrediction}
          style={{
            marginLeft: "10px",
            padding: "5px 10px",
            borderRadius: "5px",
            cursor: "pointer",
            backgroundColor: isLightMode ? "#000" : "#fff",
            color: isLightMode ? "#fff" : "#000",
          }}
        >
          Predict
        </button>
      </div>

      {predictionResult && (
        <p style={{ fontWeight: "bold", marginTop: "10px" }}>{predictionResult}</p>
      )}

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? "#e0e0e0" : "#444444"} />
          <XAxis dataKey="timestamp" stroke={isLightMode ? "#000000" : "#ffffff"} />
          <YAxis stroke={isLightMode ? "#000000" : "#ffffff"} />
          <Tooltip
            contentStyle={{
              backgroundColor: isLightMode ? "#ffffff" : "#444444",
              color: isLightMode ? "#000000" : "#ffffff",
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="humidity" stroke="#8884d8" name="Humidity (%)" />
          <Line type="monotone" dataKey="temperatureC" stroke="#82ca9d" name="Temperature (°C)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default HumidityTemperatureChart;
