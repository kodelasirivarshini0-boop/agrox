


import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import AddProduct from "./AddProduct";
import Auth from "./Auth";

const API_URL = "http://localhost:5000/api/products";

function Marketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("agroxUser");
      const savedToken = localStorage.getItem("agroxToken");

      return savedUser && savedToken
        ? JSON.parse(savedUser)
        : null;
    } catch {
      return null;
    }
  });

  // Load products from the backend
  const fetchProducts = useCallback(async () => {
    try {
      setError("");

      const response = await axios.get(API_URL);
      setProducts(response.data);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(
        "Unable to load products. Check that the backend and MongoDB are running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Update the displayed account after registration or login
  const handleLoginSuccess = (data) => {
    if (!data?.token || !data?.user) {
      setError("Authentication succeeded without account details.");
      return;
    }

    setCurrentUser(data.user);
  };

  // Clear the browser's saved session
  const handleLogout = () => {
    localStorage.removeItem("agroxToken");
    localStorage.removeItem("agroxUser");
    setCurrentUser(null);
  };

  return (
    <div className="marketplace-page">
      <nav className="navbar">
        <a className="logo" href="#home">
          🌱 Agrox
        </a>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#products">Marketplace</a>
          <a href="#add-product">Add Product</a>
          <a href="#account">
            {currentUser ? "My Account" : "Login / Register"}
          </a>
        </div>
      </nav>

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

      {/* Account section */}
      <section className="account-section" id="account">
        {currentUser ? (
          <div className="account-card">
            <p className="section-label">MY AGROX ACCOUNT</p>

            <h2>Welcome, {currentUser.name}!</h2>

            <p>
              Account type:{" "}
              <strong>
                {currentUser.role === "farmer" ? "Farmer" : "Buyer"}
              </strong>
            </p>

            {currentUser.location && (
              <p>Location: {currentUser.location}</p>
            )}

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        ) : (
          <Auth onLoginSuccess={handleLoginSuccess} />
        )}
      </section>

      {/* Add Product form */}
      <section id="add-product">
        <AddProduct onProductAdded={fetchProducts} />
      </section>

      {/* Marketplace */}
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
            No products available yet. Add the first product!
          </p>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="products-grid">
            {products.map((product) => (
              <article
                className="product-card"
                key={product._id}
              >
                <div className="product-icon">🌾</div>

                <div className="product-details">
                  <span className="product-category">
                    {product.category}
                  </span>

                  <h3>{product.name}</h3>

                  <p className="farmer-name">
                    👨‍🌾 {product.farmerName || "Demo Farmer"}
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
      </main>

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
