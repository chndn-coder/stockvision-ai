const pool = require("../db/db");

// Get saved stocks
const getWatchlist = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT
        s.symbol,
        s.company_name,
        s.current_price
      FROM watchlist w
      JOIN stocks s ON w.symbol = s.symbol
      ORDER BY s.symbol ASC
    `);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Watchlist fetch error:", error.message);

    res.status(500).json({
      success: false,
      message: "Error fetching watchlist",
    });
  }
};

// Add a stock
const addToWatchlist = async (req, res) => {
  try {
    const { symbol } = req.body;

    if (!symbol || typeof symbol !== "string") {
      return res.status(400).json({
        success: false,
        message: "Stock symbol is required",
      });
    }

    const normalizedSymbol = symbol.trim().toUpperCase();

    // Make sure the stock exists first
    const stockResult = await pool.query(
      "SELECT symbol FROM stocks WHERE symbol = $1",
      [normalizedSymbol]
    );

    if (stockResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Stock not found",
      });
    }

    // Do not add the same stock twice
    const existing = await pool.query(
      "SELECT 1 FROM watchlist WHERE symbol = $1 LIMIT 1",
      [normalizedSymbol]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `${normalizedSymbol} is already in your watchlist`,
      });
    }

    await pool.query(
      "INSERT INTO watchlist(symbol) VALUES($1)",
      [normalizedSymbol]
    );

    res.status(201).json({
      success: true,
      message: `${normalizedSymbol} added to watchlist`,
    });
  } catch (error) {
    console.error("Watchlist add error:", error.message);

    res.status(500).json({
      success: false,
      message: "Error adding stock",
    });
  }
};

// Remove a saved stock
const removeFromWatchlist = async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: "Stock symbol is required",
      });
    }

    const normalizedSymbol = symbol.trim().toUpperCase();

    // Delete all old duplicates too
    const result = await pool.query(
      "DELETE FROM watchlist WHERE symbol = $1 RETURNING symbol",
      [normalizedSymbol]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Stock is not in your watchlist",
      });
    }

    res.status(200).json({
      success: true,
      message: `${normalizedSymbol} removed from watchlist`,
    });
  } catch (error) {
    console.error("Watchlist remove error:", error.message);

    res.status(500).json({
      success: false,
      message: "Error removing stock",
    });
  }
};

module.exports = {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
};