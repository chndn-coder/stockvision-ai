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
  "BKNG"
];

const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function fetchAndStoreStocks() {
  try {
    console.log(
      "Fetching stock data from FMP (stable API)..."
    );

    for (const symbol of STOCK_SYMBOLS) {
      try {
        // Fetch quote and key metrics together
        const [quoteRes, metricsRes] =
          await Promise.all([
            axios.get(
              `https://financialmodelingprep.com/stable/quote?symbol=${symbol}&apikey=${API_KEY}`
            ),
            axios.get(
              `https://financialmodelingprep.com/stable/key-metrics?symbol=${symbol}&apikey=${API_KEY}`
            )
          ]);

        const stock = quoteRes.data?.[0];
        const metrics = metricsRes.data?.[0];

        if (!stock) {
          console.log(
            `No data for ${symbol}`
          );

          await delay(300);
          continue;
        }

        const earningsYield =
          metrics?.earningsYield;

        const calculatedPE =
          earningsYield &&
          Number(earningsYield) !== 0
            ? Number(
                (
                  1 /
                  Number(earningsYield)
                ).toFixed(2)
              )
            : null;

        await pool.query(
          `
          INSERT INTO stocks
          (
            symbol,
            company_name,
            current_price,
            market_cap,
            pe_ratio,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, NOW())

          ON CONFLICT (symbol)
          DO UPDATE SET
            company_name = EXCLUDED.company_name,
            current_price = EXCLUDED.current_price,
            market_cap = EXCLUDED.market_cap,
            pe_ratio = EXCLUDED.pe_ratio,
            updated_at = NOW();
          `,
          [
            stock.symbol,
            stock.name,
            stock.price,
            stock.marketCap,
            calculatedPE
          ]
        );

        console.log(
          `Updated: ${symbol}`
        );
      } catch (err) {
        console.log(
          `Skipped ${symbol}: ${err.message}`
        );
      }

      // Small pause between stocks
      await delay(300);
    }

    console.log(
      "Stock data update completed."
    );
  } catch (error) {
    console.error(
      "Stock Data Error:",
      error.message
    );
  }
}

module.exports = {
  fetchAndStoreStocks
};