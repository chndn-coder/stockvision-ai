const pool = require("../db/db");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/*
 * ============================================================
 * StockVision Quantitative Advisory Engine
 * ============================================================
 *
 * The quantitative score is deterministic.
 *
 * Gemini is used as an explanation layer. It does NOT directly
 * control the quantitative score or database query.
 *
 * This makes the advisory system more predictable and easier
 * to validate.
 */

/*
 * ============================================================
 * 1. QUANTITATIVE SCORE
 * ============================================================
 */

function calculateQuantitativeScore(stock) {
  let score = 0;

  /*
   * Valuation
   *
   * Positive PE below 20 receives 2 points.
   */

  if (
    stock.pe_ratio !== null &&
    stock.pe_ratio > 0 &&
    stock.pe_ratio < 20
  ) {
    score += 2;
  }

  /*
   * PEG ratio
   *
   * PEG below 1.5 is considered favorable for this
   * simplified scoring model.
   */

  if (
    stock.peg_ratio !== null &&
    stock.peg_ratio > 0 &&
    stock.peg_ratio < 1.5
  ) {
    score += 2;
  }

  /*
   * Debt efficiency
   *
   * Lower debt relative to free cash flow receives points.
   */

  if (
    stock.debt_to_fcf !== null &&
    stock.debt_to_fcf >= 0 &&
    stock.debt_to_fcf < 1
  ) {
    score += 2;
  }

  /*
   * Revenue growth
   *
   * Only positive growth receives points.
   */

  if (
    stock.revenue_growth !== null &&
    stock.revenue_growth > 0
  ) {
    score += 2;
  }

  /*
   * EBITDA growth
   *
   * Only positive growth receives points.
   */

  if (
    stock.ebitda_growth !== null &&
    stock.ebitda_growth > 0
  ) {
    score += 2;
  }

  return score;
}

/*
 * ============================================================
 * 2. RISK LEVEL
 * ============================================================
 *
 * Risk is calculated independently from the score.
 *
 * This prevents a high quantitative score from accidentally
 * hiding excessive debt risk.
 */

function calculateRiskLevel(stock, score) {
  if (
    stock.debt_to_fcf !== null &&
    stock.debt_to_fcf > 2
  ) {
    return "High";
  }

  if (score >= 7) {
    return "Low";
  }

  if (score >= 4) {
    return "Medium";
  }

  return "High";
}

/*
 * ============================================================
 * 3. BASELINE RECOMMENDATION
 * ============================================================
 *
 * This recommendation is deterministic.
 *
 * Gemini can explain the result, but it cannot silently
 * change the underlying quantitative logic.
 */

function calculateBaselineRecommendation(score, riskLevel) {
  if (riskLevel === "High") {
    return "SELL";
  }

  if (score >= 7) {
    return "BUY";
  }

  if (score >= 4) {
    return "HOLD";
  }

  return "SELL";
}

/*
 * ============================================================
 * 4. VALIDATE GEMINI RESPONSE
 * ============================================================
 *
 * Never blindly trust external AI output.
 */

function validateAIAdvisory(result) {
  if (!result || typeof result !== "object") {
    throw new Error("Invalid AI advisory response");
  }

  /*
   * Summary
   */

  if (
    typeof result.summary !== "string" ||
    result.summary.trim().length === 0
  ) {
    throw new Error("AI advisory summary is invalid");
  }

  /*
   * Strengths and risks
   */

  if (
    !Array.isArray(result.strengths) ||
    !Array.isArray(result.risks)
  ) {
    throw new Error(
      "AI advisory strengths/risks are invalid"
    );
  }

  /*
   * Recommendation
   */

  const allowedRecommendations = [
    "BUY",
    "HOLD",
    "SELL",
  ];

  if (
    !allowedRecommendations.includes(
      result.recommendation
    )
  ) {
    throw new Error("Invalid AI recommendation");
  }

  /*
   * Confidence
   */

  if (
    typeof result.confidence !== "number" ||
    result.confidence < 0 ||
    result.confidence > 100
  ) {
    throw new Error("Invalid AI confidence");
  }

  return result;
}

/*
 * ============================================================
 * 5. GENERATE STOCK ADVISORY
 * ============================================================
 */

async function generateStockAdvisory(symbol) {
  try {
    /*
     * --------------------------------------------------------
     * Validate stock symbol
     * --------------------------------------------------------
     */

    if (
      !symbol ||
      typeof symbol !== "string"
    ) {
      throw new Error("Invalid stock symbol");
    }

    const normalizedSymbol = symbol
      .trim()
      .toUpperCase();

    /*
     * --------------------------------------------------------
     * Fetch stock data
     * --------------------------------------------------------
     */

    const result = await pool.query(
      `
      SELECT
        symbol,
        company_name,
        sector,
        current_price,
        pe_ratio,
        peg_ratio,
        market_cap,
        revenue_growth,
        ebitda_growth,
        debt_to_fcf,
        volume
      FROM stocks
      WHERE symbol = $1
      `,
      [normalizedSymbol]
    );

    if (result.rows.length === 0) {
      throw new Error("Stock not found");
    }

    const stock = result.rows[0];

    /*
     * --------------------------------------------------------
     * Deterministic quantitative analysis
     * --------------------------------------------------------
     */

    const quantitativeScore =
      calculateQuantitativeScore(stock);

    const riskLevel =
      calculateRiskLevel(
        stock,
        quantitativeScore
      );

    const baselineRecommendation =
      calculateBaselineRecommendation(
        quantitativeScore,
        riskLevel
      );

    /*
     * --------------------------------------------------------
     * Prepare AI analysis
     * --------------------------------------------------------
     */

    const prompt = `
You are the AI explanation layer of StockVision,
an educational stock analysis platform.

Analyze ONLY the structured financial data provided below.

Do NOT invent financial metrics.

Do NOT use external information.

Do NOT guarantee investment returns.

Do NOT claim certainty about future stock prices.

Your job is to explain the financial information clearly
and professionally.

Stock:
Symbol: ${stock.symbol}
Company: ${stock.company_name}
Sector: ${stock.sector}

Financial Data:

Current Price: ${stock.current_price}
PE Ratio: ${stock.pe_ratio}
PEG Ratio: ${stock.peg_ratio}
Market Cap: ${stock.market_cap}
Revenue Growth: ${stock.revenue_growth}
EBITDA Growth: ${stock.ebitda_growth}
Debt to FCF: ${stock.debt_to_fcf}
Volume: ${stock.volume}

StockVision Quantitative Score:
${quantitativeScore}/10

StockVision Risk Level:
${riskLevel}

StockVision Baseline Recommendation:
${baselineRecommendation}

Return ONLY valid JSON using exactly this structure:

{
  "summary": "Short professional explanation of the stock fundamentals.",
  "strengths": [
    "strength 1",
    "strength 2"
  ],
  "risks": [
    "risk 1",
    "risk 2"
  ],
  "recommendation": "BUY",
  "confidence": 75
}

Rules:

- recommendation must be exactly BUY, HOLD, or SELL.
- confidence must be a number from 0 to 100.
- Do not invent missing financial data.
- Do not provide guaranteed returns.
- Do not claim certainty about future prices.
- Keep the summary concise.
- Return JSON only.
`;

    /*
     * --------------------------------------------------------
     * Call Gemini
     * --------------------------------------------------------
     *
     * Uses the current Google GenAI SDK.
     */

    const response =
      await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });

    const text = response.text.trim();

    /*
     * --------------------------------------------------------
     * Parse AI response
     * --------------------------------------------------------
     */

    let aiResult;

    try {
      aiResult = JSON.parse(text);
    } catch (error) {
      console.error(
        "Invalid Gemini JSON:",
        text
      );

      throw new Error(
        "AI returned invalid advisory format"
      );
    }

    /*
     * --------------------------------------------------------
     * Validate AI response
     * --------------------------------------------------------
     */

    validateAIAdvisory(aiResult);

    /*
     * --------------------------------------------------------
     * Return complete StockVision advisory
     * --------------------------------------------------------
     */

    return {
      symbol: stock.symbol,

      company: stock.company_name,

      sector: stock.sector,

      /*
       * Raw financial data used by the analysis.
       */

      financials: {
        currentPrice: stock.current_price,
        peRatio: stock.pe_ratio,
        pegRatio: stock.peg_ratio,
        marketCap: stock.market_cap,
        revenueGrowth: stock.revenue_growth,
        ebitdaGrowth: stock.ebitda_growth,
        debtToFcf: stock.debt_to_fcf,
        volume: stock.volume,
      },

      /*
       * Deterministic StockVision analysis.
       */

      quantitativeAnalysis: {
        score: quantitativeScore,
        maxScore: 10,
        riskLevel,
        baselineRecommendation,
      },

      /*
       * Gemini explanation layer.
       */

      aiAdvisory: aiResult,

      /*
       * Financial disclaimer.
       */

      disclaimer:
        "StockVision provides educational financial analysis and does not constitute personalized investment advice.",
    };
  } catch (error) {
    console.error(
      "Advisory Engine Error:",
      error.message
    );

    throw new Error(
      "Failed to generate advisory"
    );
  }
}

/*
 * ============================================================
 * EXPORT
 * ============================================================
 */

module.exports = {
  generateStockAdvisory,
};