import React, { useState, useEffect } from "react";
import axios from "axios";
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
import { io } from "socket.io-client";

const socket = io("http://127.0.0.1:5000"); // Backend WebSocket server

function GasChart() {
  const { isLightMode } = useTheme();
  const [chartData, setChartData] = useState([]);

  // Fetch all gas data on initial load
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:5000/all-data");
        const allData = response.data;

        // Map and format the gas data
        const formattedData = allData.map((entry) => ({
          ...entry.mq,
          timestamp: new Date(entry.timestamp).toLocaleTimeString(),
        }));

        setChartData(formattedData);
      } catch (error) {
        console.error("Error fetching all gas data:", error);
      }
    };

    fetchAllData();
  }, []);

  // Fetch the latest gas data periodically
  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:5000/latest-data");
        const { mq } = response.data;

        if (mq) {
          const updatedData = {
            ...mq,
            timestamp: new Date().toLocaleTimeString(),
          };

          setChartData((prevData) => [...prevData, updatedData]);

          // Check for gas alert and send broadcast via WebSocket
          if (mq.lpg === 1 || mq.co === 1 || mq.smoke === 1) {
            socket.emit("gas-alert", {
              message: "Gas detected! Take immediate action!",
              data: mq,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching latest gas data:", error);
      }
    };

    const interval = setInterval(fetchLatestData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Listen for gas alerts from WebSocket
  useEffect(() => {
    socket.on("gas-alert", (alertData) => {
      alert(alertData.message); // Display the alert
    });

    return () => {
      socket.off("gas-alert"); // Clean up listener on unmount
    };
  }, []);

  return (
    <div
      style={{
        backgroundColor: isLightMode ? "#ffffff" : "#2c2c2c",
        color: isLightMode ? "#000000" : "#ffffff",
        padding: "20px",
        borderRadius: "10px",
      }}
    >
      <h2>Gas Data Chart (LPG, CO, Smoke)</h2>
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
          <Line type="monotone" dataKey="lpg" stroke="#ff7300" name="LPG (ppm)" />
          <Line type="monotone" dataKey="co" stroke="#387908" name="CO (ppm)" />
          <Line type="monotone" dataKey="smoke" stroke="#ff0000" name="Smoke (ppm)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default GasChart;
