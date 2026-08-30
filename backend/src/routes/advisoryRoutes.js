const express = require("express");
const router = express.Router();

const { getStockAdvisory } = require("../controllers/advisoryController");
const authMiddleware = require("../middleware/authMiddleware");

// Protected AI advisory endpoint
router.get("/:symbol", authMiddleware, getStockAdvisory);

module.exports = router;