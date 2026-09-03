const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  getAlerts,
  createAlert,
  deleteAlert,
} = require("../controllers/alertController");

const router = express.Router();

// Get the user's alerts
router.get("/", authMiddleware, getAlerts);

// Create a price alert
router.post("/", authMiddleware, createAlert);

// Delete an alert
router.delete("/:id", authMiddleware, deleteAlert);

module.exports = router;