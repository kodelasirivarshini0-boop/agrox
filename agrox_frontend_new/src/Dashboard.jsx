
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import AddProduct from "./AddProduct";

const API = "http://localhost:5000/api";

function Dashboard({ user, onLogout }) {
  const isFarmer = user?.role === "farmer";

  const [products, setProducts] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [placingProduct, setPlacingProduct] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("agroxToken");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (isFarmer) {
        const [productResponse, orderResponse] = await Promise.all([
          axios.get(`${API}/products/mine`, authConfig),
          axios.get(`${API}/orders/farmer`, authConfig),
        ]);

        setMyProducts(productResponse.data);
        setOrders(orderResponse.data);
      } else {
        const [productResponse, orderResponse] = await Promise.all([
          axios.get(`${API}/products`),
          axios.get(`${API}/orders/mine`, authConfig),
        ]);

        setProducts(productResponse.data);
        setOrders(orderResponse.data);
      }
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError(
        err.response?.data?.message ||
          "Could not load dashboard information. Check your login and backend."
      );
    } finally {
      setLoading(false);
    }
  }, [isFarmer, token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handlePlaceOrder(product) {
    setError("");
    setMessage("");

    const quantity = Number(quantities[product._id]);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Enter a valid quantity greater than zero.");
      return;
    }

    if (quantity > product.quantity) {
      setError(
        `Only ${product.quantity} kg is currently available for ${product.name}.`
      );
      return;
    }

    setPlacingProduct(product._id);

    try {
      const response = await axios.post(
        `${API}/orders`,
        {
          productId: product._id,
          quantity,
        },
        authConfig
      );

      setMessage(
        response.data.message || "Order placed successfully!"
      );

      setQuantities((previous) => ({
        ...previous,
        [product._id]: "",
      }));

      await loadDashboard();
    } catch (err) {
      console.error("Place order error:", err);

      setError(
        err.response?.data?.message ||
          "Could not place the order. Please try again."
      );

      // Refresh available stock in case another buyer ordered it.
      try {
        const response = await axios.get(`${API}/products`);
        setProducts(response.data);
      } catch (refreshError) {
        console.error("Stock refresh error:", refreshError);
      }
    } finally {
      setPlacingProduct("");
    }
  }

  async function handleOrderStatus(orderId, status) {
    setError("");
    setMessage("");
    setUpdatingOrder(orderId);

    try {
      const response = await axios.patch(
        `${API}/orders/${orderId}/status`,
        { status },
        authConfig
      );

      setMessage(
        response.data.message || "Order status updated."
      );

      await loadDashboard();
    } catch (err) {
      console.error("Order status update error:", err);

      setError(
        err.response?.data?.message ||
          "Could not update the order status."
      );
    } finally {
      setUpdatingOrder("");
    }
  }

  function updateQuantity(productId, value) {
    setQuantities((previous) => ({
      ...previous,
      [productId]: value,
    }));
  }

  return (
    <section className="dashboard-section">
      <div className="dashboard-header">
        <div>
          <p className="section-label">
            AGROX {isFarmer ? "FARMER" : "BUYER"} DASHBOARD
          </p>

          <h2>Welcome, {user.name}!</h2>

          <p>
            {isFarmer
              ? "Manage your listings and incoming orders."
              : "Browse agricultural products and manage your orders."}
          </p>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>

      <div className="dashboard-stats">
        <article className="dashboard-stat-card">
          <span>Account type</span>
          <strong>{isFarmer ? "Farmer" : "Buyer"}</strong>
        </article>

        <article className="dashboard-stat-card">
          <span>Location</span>
          <strong>{user.location || "Not provided"}</strong>
        </article>

        <article className="dashboard-stat-card">
          <span>{isFarmer ? "Incoming orders" : "Your orders"}</span>
          <strong>{loading ? "..." : orders.length}</strong>
        </article>
      </div>

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="success-message" role="status">
          {message}
        </p>
      )}

      {loading && (
        <p className="status-message">
          Loading your dashboard...
        </p>
      )}

      {!loading && isFarmer && (
        <>
          <div className="dashboard-panel" id="dashboard-add-product">
            <h3>Add a new agricultural product</h3>
            <p>
              List your produce for buyers to discover.
            </p>

            <AddProduct onProductAdded={loadDashboard} />
          </div>

          <div className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h3>Your product listings</h3>
                <p>Products associated with your account.</p>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={loadDashboard}
                disabled={loading}
              >
                Refresh
              </button>
            </div>

            {myProducts.length === 0 ? (
              <p className="status-message">
                You have not listed any products yet.
              </p>
            ) : (
              <div className="dashboard-listings">
                {myProducts.map((product) => (
                  <article
                    className="dashboard-listing"
                    key={product._id}
                  >
                    <div>
                      <h4>{product.name}</h4>
                      <p>
                        {product.category}
                        {product.location
                          ? ` • ${product.location}`
                          : ""}
                      </p>
                    </div>

                    <div className="listing-price">
                      <strong>
                        ₹{Number(product.pricePerKg).toFixed(2)}/kg
                      </strong>
                      <span>
                        {product.quantity} kg available
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-panel">
            <h3>Incoming orders</h3>
            <p>Orders placed for your products.</p>

            {orders.length === 0 ? (
              <p className="status-message">
                You have no incoming orders yet.
              </p>
            ) : (
              <div className="order-list">
                {orders.map((order) => (
                  <article className="order-card" key={order._id}>
                    <div className="order-card-heading">
                      <div>
                        <h4>{order.productName}</h4>
                        <p>
                          Order ID: {order._id}
                        </p>
                      </div>

                      <span
                        className={`order-status status-${order.status}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="order-details">
                      <p>
                        Quantity: <strong>{order.quantity} kg</strong>
                      </p>
                      <p>
                        Price: <strong>₹{Number(order.pricePerKg).toFixed(2)}/kg</strong>
                      </p>
                      <p>
                        Total: <strong>₹{Number(order.totalPrice).toFixed(2)}</strong>
                      </p>
                      <p>
                        Placed:{" "}
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {order.status === "pending" && (
                      <div className="order-actions">
                        <button
                          type="button"
                          className="order-accept-button"
                          disabled={updatingOrder === order._id}
                          onClick={() =>
                            handleOrderStatus(order._id, "accepted")
                          }
                        >
                          Accept Order
                        </button>

                        <button
                          type="button"
                          className="order-reject-button"
                          disabled={updatingOrder === order._id}
                          onClick={() =>
                            handleOrderStatus(order._id, "rejected")
                          }
                        >
                          Reject Order
                        </button>
                      </div>
                    )}

                    {order.status === "accepted" && (
                      <button
                        type="button"
                        className="order-accept-button"
                        disabled={updatingOrder === order._id}
                        onClick={() =>
                          handleOrderStatus(order._id, "completed")
                        }
                      >
                        Mark as Completed
                      </button>
                    )}

                    {updatingOrder === order._id && (
                      <p className="status-message">
                        Updating order...
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!loading && !isFarmer && (
        <>
          <div className="dashboard-panel" id="buyer-products">
            <h3>Available agricultural products</h3>
            <p>
              Choose a product and enter the quantity you want to order.
            </p>

            {products.length === 0 ? (
              <p className="status-message">
                No products are available right now.
              </p>
            ) : (
              <div className="buyer-products-grid">
                {products.map((product) => (
                  <article
                    className="buyer-product-card"
                    key={product._id}
                  >
                    <span className="product-category">
                      {product.category}
                    </span>

                    <h4>{product.name}</h4>

                    <p>
                      Farmer: {product.farmerName || "Agrox Farmer"}
                    </p>

                    <p>
                      Location: {product.location || "Not provided"}
                    </p>

                    <p className="buyer-product-price">
                      ₹{Number(product.pricePerKg).toFixed(2)}/kg
                    </p>

                    <p>
                      Available: <strong>{product.quantity} kg</strong>
                    </p>

                    <label htmlFor={`quantity-${product._id}`}>
                      Quantity to order (kg)
                    </label>

                    <input
                      id={`quantity-${product._id}`}
                      type="number"
                      min="0.01"
                      max={product.quantity}
                      step="any"
                      value={quantities[product._id] ?? ""}
                      onChange={(event) =>
                        updateQuantity(product._id, event.target.value)
                      }
                      placeholder="Enter kg"
                    />

                    <button
                      type="button"
                      className="order-accept-button"
                      disabled={
                        placingProduct === product._id ||
                        product.quantity <= 0
                      }
                      onClick={() => handlePlaceOrder(product)}
                    >
                      {placingProduct === product._id
                        ? "Placing Order..."
                        : "Place Order"}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h3>Your order history</h3>
                <p>Track orders placed from your account.</p>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={loadDashboard}
                disabled={loading}
              >
                Refresh
              </button>
            </div>

            {orders.length === 0 ? (
              <p className="status-message">
                You have not placed any orders yet.
              </p>
            ) : (
              <div className="order-list">
                {orders.map((order) => (
                  <article className="order-card" key={order._id}>
                    <div className="order-card-heading">
                      <div>
                        <h4>{order.productName}</h4>
                        <p>
                          Order ID: {order._id}
                        </p>
                      </div>

                      <span
                        className={`order-status status-${order.status}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="order-details">
                      <p>Quantity: {order.quantity} kg</p>
                      <p>
                        Price: ₹{Number(order.pricePerKg).toFixed(2)}/kg
                      </p>
                      <p>
                        Total: <strong>₹{Number(order.totalPrice).toFixed(2)}</strong>
                      </p>
                      <p>
                        Placed:{" "}
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default Dashboard;
