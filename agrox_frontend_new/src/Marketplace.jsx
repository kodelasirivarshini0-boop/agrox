
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

      return savedUser && savedToken ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const fetchProducts = useCallback(async () => {
    try {
      setError("");
      const response = await axios.get(API_URL);
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load products. Please check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleLoginSuccess = (user, token) => {
    localStorage.setItem("agroxUser", JSON.stringify(user));
    localStorage.setItem("agroxToken", token);
    setCurrentUser(user);
    fetchProducts();
  };

  const handleLogout = () => {
    localStorage.removeItem("agroxUser");
    localStorage.removeItem("agroxToken");
    setCurrentUser(null);
  };

  return (
    <div className="agrox-app">
      {/* Main navigation: rendered only once */}
      <nav className="agrox-nav">
        <a className="agrox-brand" href="#home">
          🌱 Agrox
        </a>

        <div className="agrox-nav-links">
          <a href="#home">Home</a>
          <a href="#marketplace">Marketplace</a>
          <a href="#account">
            {currentUser ? "Dashboard" : "Login / Register"}
          </a>
        </div>
      </nav>

      {/* Main hero: rendered only once */}
      <header className="hero" id="home">
        <p className="hero-eyebrow">FARM DIRECT. TRADE SMART.</p>
        <h1>Welcome to Agrox</h1>
        <p>
          Connecting farmers and buyers through a transparent
          agricultural marketplace.
        </p>
        <a href="#marketplace" className="hero-button">
          Explore Products
        </a>
      </header>

      {/* Account and dashboard */}
      <section className="account-section" id="account">
        {currentUser ? (
          <Dashboard
            user={currentUser}
            onLogout={handleLogout}
          />
        ) : (
          <div className="auth-wrapper">
            <Auth onLoginSuccess={handleLoginSuccess} />
          </div>
        )}
      </section>

      {/* Public marketplace */}
      <section className="marketplace-section" id="marketplace">
        <div className="section-heading">
          <p className="section-eyebrow">FRESH FROM THE FARM</p>
          <h2>Explore Agricultural Products</h2>
          <p>Discover produce listed by farmers.</p>
        </div>

        {loading && <p className="loading">Loading products...</p>}

        {error && (
          <div className="error-message" role="alert">
            {error}
            <button type="button" onClick={fetchProducts}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <p className="empty-state">
            No products have been listed yet. Please check again later.
          </p>
        )}

        {!loading && products.length > 0 && (
          <div className="products-grid">
            {products.map((product) => (
              <article className="product-card" key={product._id}>
                <div className="product-card-icon" aria-hidden="true">
                  🌾
                </div>

                <p className="product-category">
                  {product.category}
                </p>

                <h3>{product.name}</h3>

                <p>
                  Farmer: {product.farmerName || "Agrox Farmer"}
                </p>

                <p>
                  Location: {product.location || "Not specified"}
                </p>

                <p className="product-price">
                  ₹{Number(product.pricePerKg).toFixed(2)} / kg
                </p>

                <p>
                  Available: {product.quantity} kg
                </p>

                {Number(product.quantity) <= 0 && (
                  <span className="out-of-stock">Out of stock</span>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="agrox-footer">
        <p>🌱 Agrox — Farm Direct. Trade Smart.</p>
        <p>Connecting farmers and buyers through technology.</p>
      </footer>
    </div>
  );
}

export default Marketplace;
