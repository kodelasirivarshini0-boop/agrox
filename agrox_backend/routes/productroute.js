
const express = require("express");
const Product = require("../models/Product");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/products
// Anyone can browse available products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    console.error("Fetch products error:", error);
    res.status(500).json({
      message: "Unable to fetch products.",
    });
  }
});

// POST /api/products
// Only authenticated farmers can add products
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        message: "Only registered farmers can add products.",
      });
    }

    const { name, category, quantity, pricePerKg, location } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      quantity === undefined ||
      quantity === "" ||
      pricePerKg === undefined ||
      pricePerKg === ""
    ) {
      return res.status(400).json({
        message: "Name, category, quantity and price are required.",
      });
    }

    const numericQuantity = Number(quantity);
    const numericPrice = Number(pricePerKg);

    if (
      !Number.isFinite(numericQuantity) ||
      numericQuantity <= 0 ||
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      return res.status(400).json({
        message: "Quantity and price must be positive numbers.",
      });
    }

    if (location !== undefined && typeof location !== "string") {
      return res.status(400).json({
        message: "Location must be text.",
      });
    }

    // Verify that the account still exists
    const farmer = await User.findById(req.user.userId);

    if (!farmer || farmer.role !== "farmer") {
      return res.status(403).json({
        message: "A valid farmer account is required.",
      });
    }

    const product = await Product.create({
      name: name.trim(),
      category: category.trim(),
      quantity: numericQuantity,
      pricePerKg: numericPrice,
      location: location ? location.trim() : farmer.location,
      farmerName: farmer.name,
    });

    return res.status(201).json({
      message: "Product added successfully!",
      product,
    });
  } catch (error) {
    console.error("Add product error:", error);
    return res.status(500).json({
      message: "Unable to add product.",
    });
  }
});

module.exports = router;
