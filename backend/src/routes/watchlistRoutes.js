const express = require("express");

const router = express.Router();

const {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} = require("../controllers/watchlistController");

// Get saved stocks
router.get("/", getWatchlist);

// Add a stock
router.post("/", addToWatchlist);

// Remove a stock
router.delete("/:symbol", removeFromWatchlist);

module.exports = router;