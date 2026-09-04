const pool = require("../db/db");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/*
 * StockVision quantitative advisory engine.
 *
 * The score, risk level and baseline recommendation are
 * deterministic. Gemini is only used to explain the result.
 */

/* ============================================================
   QUANTITATIVE SCORE
============================================================ */

function calculateQuantitativeScore(stock) {
  let score = 0;

  if (
    stock.pe_ratio !== null &&
    Number(stock.pe_ratio) > 0 &&
    Number(stock.pe_ratio) < 20
  ) {
    score += 2;
  }

  if (
    stock.peg_ratio !== null &&
    Number(stock.peg_ratio) > 0 &&
    Number(stock.peg_ratio) < 1.5
  ) {
    score += 2;
  }

  if (
    stock.debt_to_fcf !== null &&
    Number(stock.debt_to_fcf) >= 0 &&
    Number(stock.debt_to_fcf) < 1
  ) {
    score += 2;
  }

  if (
    stock.revenue_growth !== null &&
    Number(stock.revenue_growth) > 0
  ) {
    score += 2;
  }

  if (
    stock.ebitda_growth !== null &&
    Number(stock.ebitda_growth) > 0
  ) {
    score += 2;
  }

  return score;
}

/* ============================================================
   RISK LEVEL
============================================================ */

function calculateRiskLevel(stock, score) {
  if (
    stock.debt_to_fcf !== null &&
    Number(stock.debt_to_fcf) > 2
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

/* ============================================================
   BASELINE RECOMMENDATION
============================================================ */

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

/* ============================================================
   AI RESPONSE VALIDATION
============================================================ */

function validateAIAdvisory(result) {
  if (!result || typeof result !== "object") {
    throw new Error("Invalid AI advisory response");
  }

  if (
    typeof result.summary !== "string" ||
    result.summary.trim().length === 0
  ) {
    throw new Error("AI advisory summary is invalid");
  }

  if (
    !Array.isArray(result.strengths) ||
    !Array.isArray(result.risks)
  ) {
    throw new Error(
      "AI advisory strengths/risks are invalid"
    );
  }

  if (
    typeof result.confidence !== "number" ||
    result.confidence < 0 ||
    result.confidence > 100
  ) {
    throw new Error("Invalid AI confidence");
  }

  return result;
}

/* ============================================================
   FALLBACK ADVISORY
============================================================ */

function buildFallbackAdvisory(
  stock,
  quantitativeScore,
  riskLevel,
  baselineRecommendation
) {
  const strengths = [];
  const risks = [];

  const peRatio =
    stock.pe_ratio !== null
      ? Number(stock.pe_ratio)
      : null;

  const pegRatio =
    stock.peg_ratio !== null
      ? Number(stock.peg_ratio)
      : null;

  const debtToFcf =
    stock.debt_to_fcf !== null
      ? Number(stock.debt_to_fcf)
      : null;

  const revenueGrowth =
    stock.revenue_growth !== null
      ? Number(stock.revenue_growth)
      : null;

  const ebitdaGrowth =
    stock.ebitda_growth !== null
      ? Number(stock.ebitda_growth)
      : null;

  // Valuation
  if (peRatio !== null && peRatio > 0 && peRatio < 20) {
    strengths.push(
      "The stock has a relatively favorable positive P/E ratio in the StockVision scoring model."
    );
  } else if (peRatio !== null && peRatio >= 20) {
    risks.push(
      "The P/E ratio is above the favorable range used by the StockVision scoring model."
    );
  }

  // PEG
  if (pegRatio !== null && pegRatio > 0 && pegRatio < 1.5) {
    strengths.push(
      "The PEG ratio falls within the favorable range used by StockVision."
    );
  } else if (pegRatio !== null && pegRatio >= 1.5) {
    risks.push(
      "The PEG ratio is above the favorable range used by StockVision."
    );
  }

  // Debt
  if (
    debtToFcf !== null &&
    debtToFcf >= 0 &&
    debtToFcf < 1
  ) {
    strengths.push(
      "Debt relative to free cash flow is low in the StockVision model."
    );
  } else if (debtToFcf !== null && debtToFcf > 2) {
    risks.push(
      "Debt relative to free cash flow is elevated and increases the calculated risk level."
    );
  }

  // Revenue
  if (revenueGrowth !== null && revenueGrowth > 0) {
    strengths.push(
      "The available data indicates positive revenue growth."
    );
  } else if (revenueGrowth !== null) {
    risks.push(
      "The available data does not show positive revenue growth."
    );
  }

  // EBITDA
  if (ebitdaGrowth !== null && ebitdaGrowth > 0) {
    strengths.push(
      "The available data indicates positive EBITDA growth."
    );
  } else if (ebitdaGrowth !== null) {
    risks.push(
      "The available data does not show positive EBITDA growth."
    );
  }

  // Ensure the UI always has useful content
  if (strengths.length === 0) {
    strengths.push(
      "No major quantitative strengths were identified from the currently available metrics."
    );
  }

  if (risks.length === 0) {
    risks.push(
      "Investors should still consider market conditions and factors not included in this simplified model."
    );
  }

  const summary =
    `${stock.company_name} received a StockVision score of ` +
    `${quantitativeScore}/10 with a ${riskLevel.toLowerCase()} ` +
    `calculated risk level. The baseline recommendation is ` +
    `${baselineRecommendation}. This summary is based only on ` +
    `the financial metrics currently available in StockVision.`;

  return {
    summary,
    strengths: strengths.slice(0, 3),
    risks: risks.slice(0, 3),

    // Keep recommendation controlled by our deterministic engine
    recommendation: baselineRecommendation,

    // Lower confidence because Gemini explanation was unavailable
    confidence: 60,

    source: "fallback",
  };
}

/* ============================================================
   AI ERROR CHECK
============================================================ */

function isTemporaryAIError(error) {
  const message = String(
    error?.message || ""
  ).toLowerCase();

  const status =
    error?.status ||
    error?.code ||
    error?.response?.status;

  return (
    status === 429 ||
    status === 503 ||
    message.includes("503") ||
    message.includes("429") ||
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("resource exhausted")
  );
}

/* ============================================================
   SMALL RETRY DELAY
============================================================ */

function sleep(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

/* ============================================================
   GEMINI EXPLANATION
============================================================ */

async function generateAIExplanation(
  stock,
  quantitativeScore,
  riskLevel,
  baselineRecommendation
) {
  const prompt = `
You are the AI explanation layer of StockVision,
an educational stock analysis platform.

Analyze ONLY the structured financial data provided below.

Do NOT invent financial metrics.
Do NOT use external information.
Do NOT guarantee investment returns.
Do NOT claim certainty about future stock prices.

The recommendation has already been calculated by
StockVision's deterministic scoring engine.

You must explain that recommendation, not replace it.

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

Return ONLY valid JSON:

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
  "confidence": 75
}

Rules:

- confidence must be a number from 0 to 100.
- Do not invent missing financial data.
- Do not provide guaranteed returns.
- Do not claim certainty about future prices.
- Keep the summary concise.
- Return JSON only.
`;

  const maxAttempts = 2;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt += 1
  ) {
    try {
      const response =
        await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            temperature: 0.2,
            responseMimeType:
              "application/json",
          },
        });

      if (!response.text) {
        throw new Error(
          "AI returned an empty response"
        );
      }

      let aiResult;

      try {
        aiResult = JSON.parse(
          response.text.trim()
        );
      } catch {
        throw new Error(
          "AI returned invalid advisory JSON"
        );
      }

      validateAIAdvisory(aiResult);

      return {
        ...aiResult,

        // Never allow AI to override the quantitative engine
        recommendation:
          baselineRecommendation,

        source: "gemini",
      };
    } catch (error) {
      console.warn(
        `Gemini advisory attempt ${attempt} failed:`,
        error.message
      );

      if (
        attempt < maxAttempts &&
        isTemporaryAIError(error)
      ) {
        await sleep(1000 * attempt);
        continue;
      }

      throw error;
    }
  }
}

/* ============================================================
   GENERATE STOCK ADVISORY
============================================================ */

async function generateStockAdvisory(symbol) {
  if (
    !symbol ||
    typeof symbol !== "string"
  ) {
    throw new Error("Invalid stock symbol");
  }

  const normalizedSymbol =
    symbol.trim().toUpperCase();

  /*
   * Database and deterministic analysis errors should still
   * behave like real application errors.
   */

  let stock;

  try {
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

    stock = result.rows[0];
  } catch (error) {
    console.error(
      "Advisory Database Error:",
      error.message
    );

    // Preserve this message for the controller's 404 handling
    if (error.message === "Stock not found") {
      throw error;
    }

    throw new Error(
      "Failed to load stock data"
    );
  }

  /*
   * The core analysis does not depend on Gemini.
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
   * Try Gemini, but do not allow an AI outage to break
   * the entire advisory feature.
   */

  let aiAdvisory;

  try {
    aiAdvisory =
      await generateAIExplanation(
        stock,
        quantitativeScore,
        riskLevel,
        baselineRecommendation
      );
  } catch (error) {
    console.warn(
      "Gemini unavailable. Using StockVision fallback:",
      error.message
    );

    aiAdvisory =
      buildFallbackAdvisory(
        stock,
        quantitativeScore,
        riskLevel,
        baselineRecommendation
      );
  }

  return {
    symbol: stock.symbol,
    company: stock.company_name,
    sector: stock.sector,

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

    quantitativeAnalysis: {
      score: quantitativeScore,
      maxScore: 10,
      riskLevel,
      baselineRecommendation,
    },

    aiAdvisory,

    disclaimer:
      "StockVision provides educational financial analysis and does not constitute personalized investment advice.",
  };
}

module.exports = {
  generateStockAdvisory,
};