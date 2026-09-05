require("dotenv").config();

const cron = require("node-cron");

const app = require("./app");

const {
  refreshMarketData,
  refreshFundamentals,
} = require("./services/stockDataService");

const evaluateAlerts =
  require("./services/alertEngine");

const PORT =
  process.env.PORT || 5000;

let marketRefreshRunning = false;
let fundamentalRefreshRunning = false;
let alertEvaluationRunning = false;

/* SAFE BACKGROUND JOBS */

async function runMarketRefresh() {
  if (marketRefreshRunning) {
    console.log(
      "Market refresh already running. Skipping."
    );

    return;
  }

  marketRefreshRunning = true;

  try {
    await refreshMarketData();
  } catch (error) {
    console.error(
      "Market refresh failed:",
      error.message
    );
  } finally {
    marketRefreshRunning = false;
  }
}

async function runFundamentalRefresh() {
  if (fundamentalRefreshRunning) {
    console.log(
      "Fundamental refresh already running. Skipping."
    );

    return;
  }

  fundamentalRefreshRunning = true;

  try {
    await refreshFundamentals();
  } catch (error) {
    console.error(
      "Fundamental refresh failed:",
      error.message
    );
  } finally {
    fundamentalRefreshRunning = false;
  }
}

async function runAlertEvaluation() {
  if (alertEvaluationRunning) {
    return;
  }

  alertEvaluationRunning = true;

  try {
    console.log(
      "Running alert evaluation..."
    );

    await evaluateAlerts();
  } catch (error) {
    console.error(
      "Alert evaluation failed:",
      error.message
    );
  } finally {
    alertEvaluationRunning = false;
  }
}

/* ==========================
   BACKGROUND JOBS
========================== */

function startBackgroundJobs() {
  const jobsEnabled =
    process.env.RUN_BACKGROUND_JOBS !== "false";

  if (!jobsEnabled) {
    console.log(
      "Background jobs are disabled."
    );

    return;
  }

  const marketCron =
    process.env.MARKET_REFRESH_CRON ||
    "0 * * * *";

  const fundamentalCron =
    process.env.FUNDAMENTAL_REFRESH_CRON ||
    "30 2 * * 0";

  // Check active price alerts every minute
  cron.schedule(
    "* * * * *",
    runAlertEvaluation
  );

  // Refresh prices, volume and market cap
  cron.schedule(
    marketCron,
    runMarketRefresh
  );

  // Refresh slower-changing financial data
  cron.schedule(
    fundamentalCron,
    runFundamentalRefresh
  );

  console.log(
    "Background jobs started."
  );

  console.log(
    `Market refresh schedule: ${marketCron}`
  );

  console.log(
    `Fundamental refresh schedule: ${fundamentalCron}`
  );
}

/* ==========================
   OPTIONAL STARTUP SYNC
========================== */

async function runStartupSync() {
  const marketOnStartup =
    process.env.RUN_MARKET_SYNC_ON_STARTUP ===
    "true";

  const fundamentalsOnStartup =
    process.env
      .RUN_FUNDAMENTAL_SYNC_ON_STARTUP ===
    "true";

  if (marketOnStartup) {
    console.log(
      "Running startup market refresh..."
    );

    await runMarketRefresh();
  } else {
    console.log(
      "Startup market refresh disabled."
    );
  }

  if (fundamentalsOnStartup) {
    console.log(
      "Running startup fundamental refresh..."
    );

    await runFundamentalRefresh();
  } else {
    console.log(
      "Startup fundamental refresh disabled."
    );
  }
}

/* ==========================
   SERVER
========================== */

const server = app.listen(
  PORT,
  () => {
    console.log(
      `StockVision API running on port ${PORT}`
    );

    console.log(
      `Environment: ${
        process.env.NODE_ENV ||
        "development"
      }`
    );

    startBackgroundJobs();

    runStartupSync().catch(
      (error) => {
        console.error(
          "Startup sync failed:",
          error.message
        );
      }
    );
  }
);

/* ==========================
   GRACEFUL SHUTDOWN
========================== */

function shutdown(signal) {
  console.log(
    `${signal} received. Shutting down...`
  );

  server.close(() => {
    console.log(
      "HTTP server closed."
    );

    process.exit(0);
  });

  setTimeout(() => {
    console.error(
      "Forced shutdown after timeout."
    );

    process.exit(1);
  }, 10000).unref();
}

process.on(
  "SIGTERM",
  () => shutdown("SIGTERM")
);

process.on(
  "SIGINT",
  () => shutdown("SIGINT")
);

module.exports = server;