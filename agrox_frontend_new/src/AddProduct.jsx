
import { useState } from "react";
import axios from "axios";

function AddProduct({ onProductAdded }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: "",
    pricePerKg: "",
    location: "",
    farmerName: "Demo Farmer",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    const quantity = Number(formData.quantity);
    const pricePerKg = Number(formData.pricePerKg);

    if (quantity <= 0 || pricePerKg <= 0) {
      setError("Quantity and price must be greater than zero.");
      return;
    }

    try {
      setSaving(true);

      const response = await axios.post(
        "http://localhost:5000/api/products",
        {
          ...formData,
          quantity,
          pricePerKg,
        }
      );

      setMessage(response.data.message || "Product added successfully!");

      setFormData({
        name: "",
        category: "",
        quantity: "",
        pricePerKg: "",
        location: "",
        farmerName: "Demo Farmer",
      });

      if (onProductAdded) {
        await onProductAdded();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not add product. Please check that the backend is running."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="add-product-section">
      <h2>Add a New Product</h2>
      <p>List your agricultural products on the Agrox marketplace.</p>

      <form className="add-product-form" onSubmit={handleSubmit}>
        <label>
          Product Name
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Tomatoes"
            required
          />
        </label>

        <label>
          Category
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select category</option>
            <option value="Vegetables">Vegetables</option>
            <option value="Fruits">Fruits</option>
            <option value="Grains">Grains</option>
            <option value="Pulses">Pulses</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <label>
          Quantity (kg)
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            min="0.01"
            step="any"
            placeholder="e.g. 100"
            required
          />
        </label>

        <label>
          Price per kg (₹)
          <input
            type="number"
            name="pricePerKg"
            value={formData.pricePerKg}
            onChange={handleChange}
            min="0.01"
            step="any"
            placeholder="e.g. 25"
            required
          />
        </label>

        <label>
          Location
          <input
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. Hyderabad"
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? "Adding Product..." : "Add Product"}
        </button>
      </form>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </section>
  );
}

export default AddProduct;
