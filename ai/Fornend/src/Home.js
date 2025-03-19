import React, { useEffect, useState } from "react";
import { useTheme } from "./ThemeContext";

function Home() {
  const { isLightMode } = useTheme();
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation when the component is mounted
    setFadeIn(true);
  }, []);

  return (
    <div
      style={{
        textAlign: "center",
        animation: fadeIn ? "fadeIn 1.5s ease-in-out" : "none",
        backgroundColor: isLightMode ? "#f0f8ff" : "#2c2c2c",
        color: isLightMode ? "#000000" : "#ffffff",
        padding: "40px",
        borderRadius: "10px",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
      }}
    >
      <h2 style={{ fontSize: "2.5em", fontWeight: "bold", marginBottom: "20px" }}>
        Welcome to Sensor Data Monitor
      </h2>
      <p style={{ fontSize: "1.2em", lineHeight: "1.5em" }}>
        Use the navigation menu to view real-time data charts for humidity,
        temperature, and gas levels.
      </p>
    </div>
  );
}

export default Home;
