

import { useState } from "react";
import axios from "axios";

const AUTH_URL = "http://localhost:5000/api/auth";

function Auth({ onLoginSuccess }) {
  const [mode, setMode] = useState("register");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "buyer",
    location: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setMessage("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "register" ? "/register" : "/login";

      const payload =
        mode === "register"
          ? {
              name: formData.name.trim(),
              email: formData.email.trim(),
              password: formData.password,
              role: formData.role,
              location: formData.location.trim(),
            }
          : {
              email: formData.email.trim(),
              password: formData.password,
            };

      const response = await axios.post(
        `${AUTH_URL}${endpoint}`,
        payload
      );

      const { token, user } = response.data;

      if (!token || !user) {
        setMessage(
          response.data.message || "Request completed."
        );
        return;
      }

      // Save the session for this browser
      localStorage.setItem("agroxToken", token);
      localStorage.setItem("agroxUser", JSON.stringify(user));

      setMessage(response.data.message || "Success!");

      // Update the marketplace account display
      if (onLoginSuccess) {
        onLoginSuccess({ token, user });
      }

      setFormData((previous) => ({
        ...previous,
        password: "",
      }));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to connect. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-section">
      <div className="auth-card">
        <div className="auth-heading">
          <span className="auth-logo">🌱 Agrox</span>

          <h2>
            {mode === "register"
              ? "Create your account"
              : "Welcome back"}
          </h2>

          <p>
            {mode === "register"
              ? "Join farmers and buyers on Agrox."
              : "Log in to your Agrox account."}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => switchMode("register")}
          >
            Register
          </button>

          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => switchMode("login")}
          >
            Login
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <label>
                Full name
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  minLength={2}
                  autoComplete="name"
                  required
                />
              </label>

              <label>
                I am a
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="buyer">Buyer</option>
                  <option value="farmer">Farmer</option>
                </select>
              </label>

              <label>
                Location (optional)
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Hyderabad"
                  autoComplete="address-level2"
                />
              </label>
            </>
          )}

          <label>
            Email address
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              minLength={8}
              autoComplete={
                mode === "register"
                  ? "new-password"
                  : "current-password"
              }
              required
            />
          </label>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "register"
                ? "Create Account"
                : "Login"}
          </button>
        </form>

        {message && (
          <p className="success-message" role="status">
            {message}
          </p>
        )}

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

export default Auth;
