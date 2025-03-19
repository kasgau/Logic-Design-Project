import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './Login.css'; // Make sure the CSS file is correctly linked

function Login({ setLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginType, setLoginType] = useState("user"); // Default to normal user
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const loginEndpoint = loginType === "admin" ? "/admin-login" : "/login";
    try {
      const response = await axios.post(`http://localhost:5000${loginEndpoint}`, {
        username,
        password,
      });
      if (response.status === 200) {
        setLoggedIn(true);
        navigate(loginType === "admin" ? "/admin-dashboard" : "/"); // Redirect based on user type
      }
    } catch (err) {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form className="login-form" onSubmit={handleLogin}>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="loginType"
              value="user"
              checked={loginType === "user"}
              onChange={() => setLoginType("user")}
              className="radio-input"
            />
            Normal User
          </label>
          <label>
            <input
              type="radio"
              name="loginType"
              value="admin"
              checked={loginType === "admin"}
              onChange={() => setLoginType("admin")}
              className="radio-input"
            />
            Admin
          </label>
        </div>
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default Login;
