const axios = require("axios");
const pool = require("../db/db");

const API_KEY = process.env.FMP_API_KEY;

const STOCK_SYMBOLS = [
  // Technology
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "META",
  "NVDA",
  "AMD",
  "INTC",
  "ORCL",
  "IBM",
  "CRM",
  "ADBE",
  "CSCO",
  "QCOM",
  "AVGO",

  // Financial
  "JPM",
  "BAC",
  "WFC",
  "GS",
  "MS",
  "C",
  "AXP",
  "V",
  "MA",

  // Consumer
  "WMT",
  "COST",
  "HD",
  "MCD",
  "NKE",
  "SBUX",
  "KO",
  "PEP",
  "PG",

  // Healthcare
  "JNJ",
  "PFE",
  "MRK",
  "ABBV",
  "LLY",
  "UNH",

  // Energy
  "XOM",
  "CVX",
  "COP",

  // Industrial
  "CAT",
  "BA",
  "GE",
  "MMM",

  // Communication
  "NFLX",
  "DIS",
  "TMUS",
  "T",
  "VZ",

  // Automotive
  "TSLA",
  "GM",
  "F",

  // Semiconductors
  "MU",
  "TXN",
  "AMAT",
  "LRCX",

  // Other large companies
  "BRK-B",
  "UPS",
  "FDX",
  "LOW",
  "BKNG",
];

const REQUEST_DELAY_MS =
  Number(process.env.STOCK_REQUEST_DELAY_MS) || 1200;

const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const toNumberOrNull = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

const calculateGrowth = (
  currentValue,
  previousValue
) => {
  const current =
    toNumberOrNull(currentValue);

  const previous =
    toNumberOrNull(previousValue);

  if (
    current === null ||
    previous === null ||
    previous === 0
  ) {
    return null;
  }

  return Number(
    (
      (current - previous) /
      Math.abs(previous)
    ).toFixed(4)
  );
};

class RateLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = "RateLimitError";
  }
}

async function requestFmp(
  endpoint,
  params,
  options = {}
) {
  const { optional = false } = options;

  try {
    const response = await axios.get(
      `https://financialmodelingprep.com/stable/${endpoint}`,
      {
        params: {
          ...params,
          apikey: API_KEY,
        },
        timeout: 15000,
      }
    );

    await delay(REQUEST_DELAY_MS);

    return response.data;
  } catch (error) {
    const status =
      error.response?.status;

    await delay(REQUEST_DELAY_MS);

    if (status === 429) {
      throw new RateLimitError(
        "FMP rate limit reached"
      );
    }

    if (optional) {
      return null;
    }

    throw error;
  }
}

/* ========================================
   MARKET DATA
======================================== */

async function refreshMarketData() {
  console.log(
    "Starting market data refresh..."
  );

  let updated = 0;
  let skipped = 0;

  for (const symbol of STOCK_SYMBOLS) {
    try {
      const quoteData =
        await requestFmp(
          "quote",
          { symbol }
        );

      const stock =
        quoteData?.[0];

      if (!stock) {
        console.log(
          `No quote data for ${symbol}`
        );

        skipped += 1;
        continue;
      }

      const price =
        toNumberOrNull(stock.price);

      const marketCap =
        toNumberOrNull(
          stock.marketCap
        );

      const volume =
        toNumberOrNull(
          stock.volume
        );

      await pool.query(
        `
        INSERT INTO stocks
        (
          symbol,
          company_name,
          current_price,
          market_cap,
          volume,
          pe_ratio,
          updated_at
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          NOW()
        )

        ON CONFLICT (symbol)
        DO UPDATE SET
          company_name =
            COALESCE(
              EXCLUDED.company_name,
              stocks.company_name
            ),

          current_price =
            COALESCE(
              EXCLUDED.current_price,
              stocks.current_price
            ),

          market_cap =
            COALESCE(
              EXCLUDED.market_cap,
              stocks.market_cap
            ),

          volume =
            COALESCE(
              EXCLUDED.volume,
              stocks.volume
            ),

          pe_ratio =
            COALESCE(
              EXCLUDED.pe_ratio,
              stocks.pe_ratio
            ),

          updated_at = NOW();
        `,
        [
          stock.symbol || symbol,
          stock.name || null,
          price,
          marketCap,
          volume,
          toNumberOrNull(stock.pe),
        ]
      );

      updated += 1;

      console.log(
        `Market updated: ${symbol}`
      );
    } catch (error) {
      if (
        error instanceof RateLimitError
      ) {
        console.warn(
          "FMP rate limit reached. Stopping market refresh."
        );

        break;
      }

      skipped += 1;

      console.log(
        `Market skipped ${symbol}: ${
          error.response?.status
            ? `HTTP ${error.response.status}`
            : error.message
        }`
      );
    }
  }

  console.log(
    `Market refresh finished. Updated: ${updated}, Skipped: ${skipped}`
  );

  return {
    updated,
    skipped,
  };
}

/* ========================================
   FUNDAMENTAL DATA
======================================== */

async function refreshFundamentals() {
  console.log(
    "Starting fundamental data refresh..."
  );

  let updated = 0;
  let skipped = 0;

  for (const symbol of STOCK_SYMBOLS) {
    try {
      const profileData =
        await requestFmp(
          "profile",
          { symbol },
          { optional: true }
        );

      const metricsData =
        await requestFmp(
          "key-metrics",
          { symbol },
          { optional: true }
        );

      const incomeData =
        await requestFmp(
          "income-statement",
          {
            symbol,
            limit: 2,
          },
          { optional: true }
        );

      const cashFlowData =
        await requestFmp(
          "cash-flow-statement",
          {
            symbol,
            limit: 1,
          },
          { optional: true }
        );

      const profile =
        profileData?.[0];

      const metrics =
        metricsData?.[0];

      const incomeStatements =
        Array.isArray(incomeData)
          ? incomeData
          : [];

      const cashFlow =
        cashFlowData?.[0];

      const currentIncome =
        incomeStatements[0];

      const previousIncome =
        incomeStatements[1];

      const sector =
        profile?.sector || null;

      let peRatio = null;

      const earningsYield =
        toNumberOrNull(
          metrics?.earningsYield
        );

      if (
        earningsYield !== null &&
        earningsYield !== 0
      ) {
        peRatio = Number(
          (
            1 /
            earningsYield
          ).toFixed(2)
        );
      }

      const pegRatio =
        toNumberOrNull(
          metrics?.pegRatio
        );

      const revenueGrowth =
        calculateGrowth(
          currentIncome?.revenue,
          previousIncome?.revenue
        );

      const ebitdaGrowth =
        calculateGrowth(
          currentIncome?.ebitda,
          previousIncome?.ebitda
        );

      const freeCashFlow =
        toNumberOrNull(
          cashFlow?.freeCashFlow
        );

      const directDebtToFcf =
        toNumberOrNull(
          metrics?.debtToFreeCashFlow
        );

      const totalDebt =
        toNumberOrNull(
          metrics?.totalDebt
        );

      let debtToFcf =
        directDebtToFcf;

      if (
        debtToFcf === null &&
        totalDebt !== null &&
        freeCashFlow !== null &&
        freeCashFlow !== 0
      ) {
        debtToFcf = Number(
          (
            totalDebt /
            Math.abs(freeCashFlow)
          ).toFixed(4)
        );
      }

      await pool.query(
        `
        UPDATE stocks

        SET
          sector =
            COALESCE(
              $2,
              sector
            ),

          pe_ratio =
            COALESCE(
              $3,
              pe_ratio
            ),

          peg_ratio =
            COALESCE(
              $4,
              peg_ratio
            ),

          debt_to_fcf =
            COALESCE(
              $5,
              debt_to_fcf
            ),

          revenue_growth =
            COALESCE(
              $6,
              revenue_growth
            ),

          ebitda_growth =
            COALESCE(
              $7,
              ebitda_growth
            )

        WHERE symbol = $1;
        `,
        [
          symbol,
          sector,
          peRatio,
          pegRatio,
          debtToFcf,
          revenueGrowth,
          ebitdaGrowth,
        ]
      );

      updated += 1;

      console.log(
        `Fundamentals updated: ${symbol}`
      );
    } catch (error) {
      if (
        error instanceof RateLimitError
      ) {
        console.warn(
          "FMP rate limit reached. Stopping fundamental refresh."
        );

        break;
      }

      skipped += 1;

      console.log(
        `Fundamentals skipped ${symbol}: ${
          error.response?.status
            ? `HTTP ${error.response.status}`
            : error.message
        }`
      );
    }
  }

  console.log(
    `Fundamental refresh finished. Updated: ${updated}, Skipped: ${skipped}`
  );

  return {
    updated,
    skipped,
  };
}

module.exports = {
  refreshMarketData,
  refreshFundamentals,
};