
const mongoose = require("mongoose");
const Product = require("../models/Product");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    pricePerKg: { type: Number, required: true, min: 0 },
    location: { type: String, default: "" },
    farmerName: { type: String, default: "Demo Farmer" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);

