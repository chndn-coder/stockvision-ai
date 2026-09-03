const pool = require("../db/db");

// Get the current user's alerts
const getAlerts = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        dsl,
        is_active,
        last_triggered_at,
        created_at
      FROM alerts
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    res.status(200).json({
      success: true,
      alerts: result.rows,
    });
  } catch (error) {
    console.error("Alert Fetch Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch alerts",
    });
  }
};

// Create a price alert
const createAlert = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      name,
      symbol,
      operator,
      targetPrice,
    } = req.body;

    if (
      !name?.trim() ||
      !symbol?.trim() ||
      !operator ||
      targetPrice === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, symbol, condition and target price are required",
      });
    }

    const normalizedSymbol = symbol
      .trim()
      .toUpperCase();

    const numericTargetPrice = Number(targetPrice);

    if (
      !Number.isFinite(numericTargetPrice) ||
      numericTargetPrice <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Target price must be greater than 0",
      });
    }

    const allowedOperators = [
      ">=",
      "<=",
    ];

    if (!allowedOperators.includes(operator)) {
      return res.status(400).json({
        success: false,
        message: "Invalid alert condition",
      });
    }

    // Make sure the stock exists
    const stockResult = await pool.query(
      `
      SELECT symbol
      FROM stocks
      WHERE symbol = $1
      `,
      [normalizedSymbol]
    );

    if (stockResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Stock not found",
      });
    }

    const dsl = {
      type: "price",
      symbol: normalizedSymbol,
      operator,
      targetPrice: numericTargetPrice,
    };

    const result = await pool.query(
      `
      INSERT INTO alerts (
        user_id,
        name,
        dsl,
        is_active
      )
      VALUES ($1, $2, $3, true)
      RETURNING *
      `,
      [
        userId,
        name.trim(),
        JSON.stringify(dsl),
      ]
    );

    res.status(201).json({
      success: true,
      message: "Price alert created",
      alert: result.rows[0],
    });
  } catch (error) {
    console.error("Alert Create Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to create alert",
    });
  }
};

// Delete an alert
const deleteAlert = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM alerts
      WHERE id = $1
        AND user_id = $2
      RETURNING id
      `,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Alert not found or unauthorized",
      });
    }

    res.status(200).json({
      success: true,
      message: "Alert deleted",
    });
  } catch (error) {
    console.error("Alert Delete Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to delete alert",
    });
  }
};

module.exports = {
  getAlerts,
  createAlert,
  deleteAlert,
};