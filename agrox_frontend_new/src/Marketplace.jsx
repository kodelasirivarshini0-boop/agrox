
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
      console.error("Could not restore Agrox session:", err);
    }

    return null;
  });

  // Load products for the public marketplace.
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(API_URL);
      setProducts(response.data);
    } catch (err) {
      console.error("Error fetching products:", err);

      setError(
        "Unable to load products. Please check that the backend and MongoDB are running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle successful registration or login.
  function handleLoginSuccess({ token, user }) {
    localStorage.setItem("agroxToken", token);
    localStorage.setItem("agroxUser", JSON.stringify(user));

    setCurrentUser(user);
    setError("");
  }

  // Log out the current user.
  function handleLogout() {
    localStorage.removeItem("agroxToken");
    localStorage.removeItem("agroxUser");

    setCurrentUser(null);
  }

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="marketplace-page">
      {/* Navigation */}
      <nav className="navbar">
        <a className="logo" href="#home">
          🌱 Agrox
        </a>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#products">Marketplace</a>

          {currentUser?.role === "farmer" && (
            <a href="#dashboard-add-product">Add Product</a>
          )}

          <a href="#account">
            {currentUser ? "Dashboard" : "Login / Register"}
          </a>
        </div>
      </nav>

      {/* Hero section */}
      <header className="hero" id="home">
        <div className="hero-content">
          <p className="hero-tagline">
            FARM FRESH • DIRECT TRADE
          </p>

          <h1>
            From Farmers
            <br />
            to Your Table.
          </h1>

          <p className="hero-description">
            Agrox connects farmers and buyers to make
            agricultural trading simpler and more transparent.
          </p>

          <a href="#products" className="hero-button">
            Explore Products
          </a>
        </div>
      </header>

      {/* Show either the login form or one role-specific dashboard */}
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
      <main className="products-section" id="products">
        <div className="section-heading">
          <p className="section-label">AGROX MARKETPLACE</p>

          <h2>Fresh From Our Farmers</h2>

          <p>
            Discover agricultural products listed on Agrox.
          </p>
        </div>

        {loading && (
          <p className="status-message">Loading products...</p>
        )}

        {!loading && error && (
          <div className="status-message error-message">
            <p>{error}</p>

            <button type="button" onClick={fetchProducts}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <p className="status-message">
            No products available yet. Farmers can add the first product.
          </p>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="products-grid">
            {products.map((product) => (
              <article className="product-card" key={product._id}>
                <div className="product-icon" aria-hidden="true">
                  🌾
                </div>

                <div className="product-details">
                  <span className="product-category">
                    {product.category}
                  </span>

                  <h3>{product.name}</h3>

                  <p className="farmer-name">
                    👨‍🌾 {product.farmerName || "Agrox Farmer"}
                  </p>

                  {product.location && (
                    <p className="product-location">
                      📍 {product.location}
                    </p>
                  )}

                  <div className="product-info">
                    <div>
                      <span className="info-label">
                        Available quantity
                      </span>

                      <p>{product.quantity} kg</p>
                    </div>

                    <div>
                      <span className="info-label">
                        Price per kg
                      </span>

                      <p className="product-price">
                        ₹{Number(product.pricePerKg).toFixed(2)}
                      </p>
                    </div>
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
      </main>

      {/* Footer */}
      <footer className="footer">
        <h2>🌱 Agrox</h2>

        <p>
          Building a better connection between farmers and buyers.
        </p>

        <p className="footer-note">
          © {new Date().getFullYear()} Agrox. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default Marketplace;
