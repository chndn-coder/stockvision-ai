const pool = require("../db/db");

// Add a holding
const addToPortfolio = async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, quantity, buy_price } = req.body;

    if (!symbol || quantity === undefined || buy_price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Symbol, quantity and buy price are required",
      });
    }

    const normalizedSymbol = String(symbol)
      .trim()
      .toUpperCase();

    const parsedQuantity = Number(quantity);
    const parsedBuyPrice = Number(buy_price);

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    if (
      !Number.isFinite(parsedBuyPrice) ||
      parsedBuyPrice <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Buy price must be greater than 0",
      });
    }

    // Make sure the stock exists
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

    await pool.query(
      `
      INSERT INTO portfolio (
        user_id,
        symbol,
        quantity,
        buy_price
      )
      VALUES ($1, $2, $3, $4)
      `,
      [
        userId,
        normalizedSymbol,
        parsedQuantity,
        parsedBuyPrice,
      ]
    );

    res.status(201).json({
      success: true,
      message: `${normalizedSymbol} added to portfolio`,
    });
  } catch (error) {
    console.error(
      "Portfolio Add Error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get the current user's portfolio
const getPortfolio = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        p.id,
        p.symbol,
        s.company_name,
        p.quantity,
        p.buy_price,
        s.current_price,
        (p.quantity * p.buy_price) AS invested_value,
        (p.quantity * s.current_price) AS current_value,
        (
          (p.quantity * s.current_price)
          -
          (p.quantity * p.buy_price)
        ) AS profit_loss
      FROM portfolio p
      JOIN stocks s
        ON p.symbol = s.symbol
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
      `,
      [userId]
    );

    const totalInvested = result.rows.reduce(
      (sum, row) =>
        sum + Number(row.invested_value || 0),
      0
    );

    const totalCurrent = result.rows.reduce(
      (sum, row) =>
        sum + Number(row.current_value || 0),
      0
    );

    const totalProfitLoss =
      totalCurrent - totalInvested;

    const totalReturnPercent =
      totalInvested > 0
        ? (totalProfitLoss / totalInvested) * 100
        : 0;

    res.status(200).json({
      success: true,
      holdings: result.rows,
      summary: {
        totalInvested,
        totalCurrent,
        totalProfitLoss,
        totalReturnPercent,
      },
    });
  } catch (error) {
    console.error(
      "Portfolio Fetch Error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete one holding
const deleteHolding = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM portfolio
      WHERE id = $1
        AND user_id = $2
      RETURNING *
      `,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Holding not found or unauthorized",
      });
    }

    res.status(200).json({
      success: true,
      message: "Holding removed from portfolio",
    });
  } catch (error) {
    console.error(
      "Portfolio Delete Error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  addToPortfolio,
  getPortfolio,
  deleteHolding,
};