
import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import Auth from "./Auth";
import Dashboard from "./Dashboard";
import "./App.css";

const API_URL = "http://localhost:5000/api/products";

function Marketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("agroxUser");
      const savedToken = localStorage.getItem("agroxToken");

      if (savedUser && savedToken) {
        return JSON.parse(savedUser);
      }
    } catch (err) {
      console.error("Could not restore user session:", err);
    }

    return null;
  });

  // Load all products for the public marketplace.
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(API_URL);
      setProducts(response.data);
    } catch (err) {
      console.error("Error fetching products:", err);

      setError(
        "Could not load products. Please check that your backend and MongoDB are running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Save the successful login and update the page.
  // Declare this before the JSX uses it.
  const handleLoginSuccess = ({ token, user }) => {
    localStorage.setItem("agroxToken", token);
    localStorage.setItem("agroxUser", JSON.stringify(user));

    setCurrentUser(user);
    setError("");
  };

  // Log out and clear the saved session.
  const handleLogout = () => {
    localStorage.removeItem("agroxToken");
    localStorage.removeItem("agroxUser");

    setCurrentUser(null);
  };

  // Fetch marketplace products when the component loads.
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="app-container">
      {/* Navigation */}
      <nav className="navbar">
        <a href="#home" className="logo">
          🌱 Agrox
        </a>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#products">Marketplace</a>
          <a href="#account">
            {currentUser ? "Dashboard" : "Login / Register"}
          </a>
        </div>
      </nav>

      {/* Hero section */}
      <header className="hero-section" id="home">
        <div className="hero-content">
          <p className="section-label">
            FARM DIRECT. TRADE SMART.
          </p>

          <h1>
            Welcome to <span>Agrox</span>
          </h1>

          <p>
            Connecting farmers and buyers through a transparent
            agricultural marketplace.
          </p>

          <a href="#products" className="hero-button">
            Explore Products
          </a>
        </div>
      </header>

      {/* Login or role-specific dashboard */}
      <section id="account">
        {currentUser ? (
          <Dashboard
            user={currentUser}
            onLogout={handleLogout}
          />
        ) : (
          <Auth onLoginSuccess={handleLoginSuccess} />
        )}
      </section>

      {/* Public marketplace */}
      <section className="marketplace-section" id="products">
        <div className="section-heading">
          <p className="section-label">FRESH FROM FARMERS</p>
          <h2>Explore Agricultural Products</h2>
          <p>
            Browse the products currently listed on Agrox.
          </p>
        </div>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p className="status-message">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="status-message">
            No products are available yet. Farmer listings will
            appear here when products are added.
          </p>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <article className="product-card" key={product._id}>
                <div className="product-card-icon" aria-hidden="true">
                  🌾
                </div>

                <div className="product-card-content">
                  <span className="product-category">
                    {product.category}
                  </span>

                  <h3>{product.name}</h3>

                  <p className="product-farmer">
                    Farmer: {product.farmerName || "Agrox Farmer"}
                  </p>

                  <p className="product-location">
                    📍 {product.location || "Location not provided"}
                  </p>

                  <div className="product-card-footer">
                    <div>
                      <strong>
                        ₹{Number(product.pricePerKg).toFixed(2)}
                      </strong>
                      <span> / kg</span>
                    </div>

                    <span className="product-quantity">
                      {product.quantity} kg available
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <button
          type="button"
          className="secondary-button refresh-products-button"
          onClick={fetchProducts}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Marketplace"}
        </button>
      </section>

      {/* Footer */}
      <footer className="footer">
        <h3>🌱 Agrox</h3>
        <p>
          Building a better connection between farmers and buyers.
        </p>
        <p>© {new Date().getFullYear()} Agrox. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Marketplace;

