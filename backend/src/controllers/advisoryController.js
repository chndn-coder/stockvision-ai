const { generateStockAdvisory } = require("../services/advisoryService");

const getStockAdvisory = async (req, res) => {
  try {
    const { symbol } = req.params;

    // Validate the stock symbol before processing it.
    if (!symbol || typeof symbol !== "string") {
      return res.status(400).json({
        success: false,
        message: "A valid stock symbol is required",
      });
    }

    const normalizedSymbol = symbol.trim().toUpperCase();

    // Basic symbol validation.
    // Allows common stock symbols such as INFY, TCS, AAPL.
    if (!/^[A-Z0-9.-]{1,20}$/.test(normalizedSymbol)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock symbol",
      });
    }

    const advisory =
      await generateStockAdvisory(normalizedSymbol);

    return res.status(200).json({
      success: true,
      data: advisory,
    });
  } catch (error) {
    console.error(
      "Stock Advisory Controller Error:",
      error.message
    );

    /*
     * Keep internal errors out of the production response.
     * The frontend only needs a safe, useful message.
     */
    if (error.message === "Stock not found") {
      return res.status(404).json({
        success: false,
        message: "Stock not found",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to generate stock advisory at the moment",
    });
  }
};

module.exports = {
  getStockAdvisory,
};