import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSpring, animated, useSprings } from "@react-spring/web";
import "./AdminDashboard.css"; // Add a CSS file for styling

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: "", password: "", isAdmin: false });

  const fetchUsers = async () => {
    const response = await axios.get("http://localhost:5000/users");
    setUsers(response.data);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    await axios.post("http://localhost:5000/users", {
      username: newUser.username,
      password: newUser.password,
      is_admin: newUser.isAdmin ? 1 : 0,
    });
    setNewUser({ username: "", password: "", isAdmin: false });
    fetchUsers();
  };

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5000/logout");
      window.location.href = "/login"; // Redirect to login page
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const formAnimation = useSpring({
    from: { opacity: 0, transform: "translateY(50px)" },
    to: { opacity: 1, transform: "translateY(0)" },
    config: { tension: 200, friction: 20 },
  });

  const buttonAnimation = useSpring({
    from: { transform: "scale(1)" },
    to: { transform: "scale(1.1)" },
    reset: true,
    reverse: true,
    config: { tension: 120, friction: 10 },
    loop: true,
  });

  const userAnimations = useSprings(
    users.length,
    users.map(() => ({
      from: { opacity: 0, transform: "translateX(-50px)" },
      to: { opacity: 1, transform: "translateX(0)" },
      config: { tension: 120, friction: 14 },
    }))
  );

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>
      <main>
        <section>
          <h2>Users</h2>
          <ul className="user-list">
            {userAnimations.map((style, index) => (
              <animated.li
                key={users[index]?.id}
                style={style}
                className="user-item"
              >
                {users[index]?.username} {users[index]?.is_admin ? "(Admin)" : ""}
              </animated.li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Create New User</h2>
          <animated.form
            className="create-user-form"
            style={formAnimation}
            onSubmit={handleCreateUser}
          >
            <input
              type="text"
              placeholder="Username"
              className="input-field"
              value={newUser.username}
              onChange={(e) =>
                setNewUser({ ...newUser, username: e.target.value })
              }
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="input-field"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
              required
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={newUser.isAdmin}
                onChange={(e) =>
                  setNewUser({ ...newUser, isAdmin: e.target.checked })
                }
              />
              Is Admin
            </label>
            <animated.button
              type="submit"
              className="submit-button"
              style={buttonAnimation}
            >
              Create User
            </animated.button>
          </animated.form>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
