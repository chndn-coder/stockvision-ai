require("dotenv").config();

const cron = require("node-cron");

const app = require("./app");
const { fetchAndStoreStocks } = require("./services/stockDataService");
const evaluateAlerts = require("./services/alertEngine");

const PORT = process.env.PORT || 5000;

/* ==========================
   BACKGROUND JOBS
========================== */

function startBackgroundJobs() {
  const jobsEnabled =
    process.env.RUN_BACKGROUND_JOBS !== "false";

  if (!jobsEnabled) {
    console.log("Background jobs are disabled.");
    return;
  }

  // Check active price alerts every minute
  cron.schedule("* * * * *", async () => {
    try {
      console.log("Running alert evaluation...");
      await evaluateAlerts();
    } catch (error) {
      console.error(
        "Alert evaluation failed:",
        error.message
      );
    }
  });

  console.log("Background jobs started.");
}

/* ==========================
   INITIAL STOCK UPDATE
========================== */

async function updateStocksOnStartup() {
  try {
    console.log("Fetching stock data...");

    await fetchAndStoreStocks();

    console.log("Stock data update completed.");
  } catch (error) {
    console.error(
      "Stock fetch failed:",
      error.message
    );
  }
}

/* ==========================
   SERVER
========================== */

const server = app.listen(PORT, () => {
  console.log(
    `StockVision API running on port ${PORT}`
  );

  console.log(
    `Environment: ${
      process.env.NODE_ENV || "development"
    }`
  );

  startBackgroundJobs();

  updateStocksOnStartup();
});

/* ==========================
   GRACEFUL SHUTDOWN
========================== */

function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);

  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });

  setTimeout(() => {
    console.error(
      "Forced shutdown after timeout."
    );

    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () =>
  shutdown("SIGTERM")
);

process.on("SIGINT", () =>
  shutdown("SIGINT")
);

module.exports = server;