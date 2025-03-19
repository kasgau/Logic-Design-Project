import React, { useState } from "react";
import axios from "axios";

function SetThreshold() {
  const [threshold, setThreshold] = useState("");

  const handleSetThreshold = async () => {
    if (!threshold) {
      alert("Please enter a valid threshold.");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:5000/set-threshold", {
        temperature_threshold: parseFloat(threshold),
      });

      alert(response.data.message);
    } catch (error) {
      console.error("Error setting threshold:", error);
      alert("Failed to set threshold. Please try again.");
    }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <h3>Set Temperature Alert Threshold</h3>
      <input
        type="number"
        value={threshold}
        onChange={(e) => setThreshold(e.target.value)}
        placeholder="Enter temperature threshold"
        style={{
          padding: "5px",
          borderRadius: "5px",
          marginRight: "10px",
        }}
      />
      <button
        onClick={handleSetThreshold}
        style={{
          padding: "5px 10px",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Set Threshold
      </button>
    </div>
  );
}

export default SetThreshold;
