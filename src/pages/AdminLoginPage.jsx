import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";
import "../styles/admin.css";

const AdminLoginPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // If already logged in, redirect to admin page
    useEffect(() => {
        if (sessionStorage.getItem("isAdminLoggedIn") === "true") {
            navigate("/admin");
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const data = await login(username, password);
            // Store the JWT token and login flag
            sessionStorage.setItem("isAdminLoggedIn", "true");
            sessionStorage.setItem("adminToken", data.access_token);
            navigate("/admin");
        } catch (err) {
            setError(err.message || "Invalid username or password");
        }
    };

    return (
        <div className="admin-login-wrapper">
            <form className="admin-login-card" onSubmit={handleLogin}>
                <h1>Login</h1>

                <div className="input-group">
                    <label htmlFor="admin-username">Username</label>
                    <input
                        id="admin-username"
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="admin-password">Password</label>
                    <input
                        id="admin-password"
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                    />
                </div>

                <button type="submit" className="login-btn">
                    Login
                </button>

                {error && <p className="login-error">{error}</p>}
            </form>
        </div>
    );
};

export default AdminLoginPage;
