
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import AddProduct from "./AddProduct";

const API = "http://localhost:5000/api";

function Dashboard({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyProduct, setBusyProduct] = useState("");
  const [busyOrder, setBusyOrder] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("agroxToken");
  const isFarmer = user?.role === "farmer";

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const loadDashboard = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError("");

    try {
      if (isFarmer) {
        const [productsResponse, ordersResponse] = await Promise.all([
          axios.get(`${API}/products/mine`, authConfig),
          axios.get(`${API}/orders/farmer`, authConfig),
        ]);

        setMyProducts(
          Array.isArray(productsResponse.data)
            ? productsResponse.data
            : []
        );

        setOrders(
          Array.isArray(ordersResponse.data)
            ? ordersResponse.data
            : []
        );
      } else {
        const [productsResponse, ordersResponse] = await Promise.all([
          axios.get(`${API}/products`, authConfig),
          axios.get(`${API}/orders/mine`, authConfig),
        ]);

        setProducts(
          Array.isArray(productsResponse.data)
            ? productsResponse.data
            : []
        );

        setOrders(
          Array.isArray(ordersResponse.data)
            ? ordersResponse.data
            : []
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load dashboard data. Please check your connection."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isFarmer, token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const refreshOrders = async () => {
    setRefreshing(true);
    await loadDashboard(false);
  };

  const handlePlaceOrder = async (product) => {
    const quantity = Number(quantities[product._id]);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Enter a valid order quantity greater than zero.");
      return;
    }

    if (quantity > Number(product.quantity)) {
      setError("Your order exceeds the available stock.");
      return;
    }

    setBusyProduct(product._id);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(
        `${API}/orders`,
        {
          productId: product._id,
          quantity,
        },
        authConfig
      );

      setMessage(response.data.message || "Order placed successfully!");

      setQuantities((previous) => ({
        ...previous,
        [product._id]: "",
      }));

      await loadDashboard(false);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to place your order."
      );

      await loadDashboard(false);
    } finally {
      setBusyProduct("");
    }
  };

  const handleOrderStatus = async (orderId, status) => {
    setBusyOrder(orderId);
    setError("");
    setMessage("");

    try {
      const response = await axios.patch(
        `${API}/orders/${orderId}/status`,
        { status },
        authConfig
      );

      setMessage(response.data.message || "Order updated successfully.");
      await loadDashboard(false);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update order status."
      );
    } finally {
      setBusyOrder("");
    }
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
      ? "Date unavailable"
      : parsedDate.toLocaleString();
  };

  const formatMoney = (amount) =>
    `₹${Number(amount || 0).toFixed(2)}`;

  const totalSpent = orders.reduce(
    (total, order) => total + Number(order.totalPrice || 0),
    0
  );

  if (!user) return null;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">
            AGROX {isFarmer ? "FARMER" : "BUYER"} DASHBOARD
          </p>

          <h2>Welcome, {user.name}!</h2>

          <p>
            {isFarmer
              ? "Manage your listings and incoming orders."
              : "Explore farm produce and manage your orders."}
          </p>
        </div>

        <button
          className="secondary-button"
          type="button"
          onClick={onLogout}
        >
          Logout
        </button>
      </header>

      <div className="dashboard-info">
        <p>
          Account type: <strong>{user.role}</strong>
        </p>

        <p>
          Location: <strong>{user.location || "Not specified"}</strong>
        </p>

        {isFarmer ? (
          <p>
            Incoming orders: <strong>{orders.length}</strong>
          </p>
        ) : (
          <>
            <p>
              Total orders: <strong>{orders.length}</strong>
            </p>
            <p>
              Total order value: <strong>{formatMoney(totalSpent)}</strong>
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="success-message" role="status">
          {message}
        </div>
      )}

      {loading ? (
        <p className="loading">Loading your dashboard...</p>
      ) : (
        <>
          {isFarmer ? (
            <>
              <section className="dashboard-section">
                <h3>Add a new agricultural product</h3>
                <p>List your produce for buyers to discover.</p>

                <AddProduct onProductAdded={() => loadDashboard(false)} />
              </section>

              <section className="dashboard-section">
                <h3>My product listings</h3>

                {myProducts.length === 0 ? (
                  <p className="empty-state">
                    You haven't listed any products yet.
                  </p>
                ) : (
                  <div className="products-grid">
                    {myProducts.map((product) => (
                      <article className="product-card" key={product._id}>
                        <h4>{product.name}</h4>
                        <p>Category: {product.category}</p>
                        <p>
                          Price: {formatMoney(product.pricePerKg)} / kg
                        </p>
                        <p>Available stock: {product.quantity} kg</p>
                        <p>
                          Location: {product.location || "Not specified"}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="dashboard-section">
                <h3>Incoming orders</h3>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={refreshOrders}
                  disabled={refreshing}
                >
                  {refreshing ? "Refreshing..." : "Refresh orders"}
                </button>

                {orders.length === 0 ? (
                  <p className="empty-state">
                    You don't have any incoming orders yet.
                  </p>
                ) : (
                  <div className="order-list">
                    {orders.map((order) => (
                      <article className="order-card" key={order._id}>
                        <h4>{order.productName}</h4>
                        <p>Quantity: {order.quantity} kg</p>
                        <p>Total: {formatMoney(order.totalPrice)}</p>
                        <p>
                          Status:{" "}
                          <span className={`order-status status-${order.status}`}>
                            {order.status}
                          </span>
                        </p>
                        <p>Ordered: {formatDate(order.createdAt)}</p>

                        {order.status === "pending" && (
                          <div className="order-actions">
                            <button
                              type="button"
                              disabled={busyOrder === order._id}
                              onClick={() =>
                                handleOrderStatus(order._id, "accepted")
                              }
                            >
                              {busyOrder === order._id ? "Updating..." : "Accept"}
                            </button>

                            <button
                              type="button"
                              disabled={busyOrder === order._id}
                              onClick={() =>
                                handleOrderStatus(order._id, "rejected")
                              }
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {order.status === "accepted" && (
                          <div className="order-actions">
                            <button
                              type="button"
                              disabled={busyOrder === order._id}
                              onClick={() =>
                                handleOrderStatus(order._id, "completed")
                              }
                            >
                              Mark as completed
                            </button>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            <>
              <section className="dashboard-section">
                <h3>Available products</h3>

                {products.length === 0 ? (
                  <p className="empty-state">
                    No products are currently available.
                  </p>
                ) : (
                  <div className="products-grid">
                    {products.map((product) => (
                      <article className="product-card" key={product._id}>
                        <h4>{product.name}</h4>
                        <p>Category: {product.category}</p>
                        <p>
                          Farmer: {product.farmerName || "Agrox Farmer"}
                        </p>
                        <p>
                          Price: {formatMoney(product.pricePerKg)} / kg
                        </p>
                        <p>Available stock: {product.quantity} kg</p>

                        {Number(product.quantity) > 0 ? (
                          <>
                            <label htmlFor={`quantity-${product._id}`}>
                              Order quantity (kg)
                            </label>

                            <input
                              id={`quantity-${product._id}`}
                              type="number"
                              min="0.01"
                              max={product.quantity}
                              step="0.01"
                              value={quantities[product._id] ?? ""}
                              onChange={(event) =>
                                setQuantities((previous) => ({
                                  ...previous,
                                  [product._id]: event.target.value,
                                }))
                              }
                              placeholder="Enter quantity"
                            />

                            <button
                              type="button"
                              disabled={busyProduct === product._id}
                              onClick={() => handlePlaceOrder(product)}
                            >
                              {busyProduct === product._id
                                ? "Placing order..."
                                : "Place order"}
                            </button>
                          </>
                        ) : (
                          <p className="out-of-stock">Out of stock</p>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="dashboard-section">
                <div className="order-history-heading">
                  <div>
                    <h3>My order history</h3>
                    <p>Track all your agricultural purchases.</p>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={refreshOrders}
                    disabled={refreshing}
                  >
                    {refreshing ? "Refreshing..." : "Refresh orders"}
                  </button>
                </div>

                {orders.length === 0 ? (
                  <p className="empty-state">
                    You haven't placed any orders yet.
                  </p>
                ) : (
                  <div className="order-list">
                    {orders.map((order) => (
                      <article className="order-card" key={order._id}>
                        <h4>{order.productName}</h4>

                        <p>Quantity: {order.quantity} kg</p>

                        <p>
                          Price per kg: {formatMoney(order.pricePerKg)}
                        </p>

                        <p>
                          Total: <strong>{formatMoney(order.totalPrice)}</strong>
                        </p>

                        <p>
                          Status:{" "}
                          <span className={`order-status status-${order.status}`}>
                            {order.status}
                          </span>
                        </p>

                        <p>Ordered: {formatDate(order.createdAt)}</p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
