const pool = require("../db/db");

async function evaluateAlerts() {
  try {
    const alertsResult = await pool.query(
      `
      SELECT
        id,
        name,
        dsl,
        last_triggered_at
      FROM alerts
      WHERE is_active = true
      `
    );

    for (const alert of alertsResult.rows) {
      const dsl = alert.dsl;

      if (
        !dsl ||
        dsl.type !== "price" ||
        !dsl.symbol
      ) {
        continue;
      }

      const stockResult = await pool.query(
        `
        SELECT
          symbol,
          current_price
        FROM stocks
        WHERE symbol = $1
        `,
        [dsl.symbol]
      );

      if (stockResult.rows.length === 0) {
        continue;
      }

      const stock = stockResult.rows[0];

      const currentPrice =
        Number(stock.current_price);

      const targetPrice =
        Number(dsl.targetPrice);

      if (
        !Number.isFinite(currentPrice) ||
        !Number.isFinite(targetPrice)
      ) {
        continue;
      }

      let triggered = false;

      if (dsl.operator === ">=") {
        triggered =
          currentPrice >= targetPrice;
      }

      if (dsl.operator === "<=") {
        triggered =
          currentPrice <= targetPrice;
      }

      if (!triggered) {
        continue;
      }

      // Avoid triggering the same alert every minute
      if (alert.last_triggered_at) {
        const lastTriggered =
          new Date(alert.last_triggered_at);

        const now = new Date();

        const minutesSinceLastTrigger =
          (now - lastTriggered) / 60000;

        if (minutesSinceLastTrigger < 60) {
          continue;
        }
      }

      console.log(
        `🔔 Alert Triggered: ${alert.name}`
      );

      console.log(
        `${stock.symbol}: ${currentPrice} ${dsl.operator} ${targetPrice}`
      );

      await pool.query(
        `
        UPDATE alerts
        SET last_triggered_at = NOW()
        WHERE id = $1
        `,
        [alert.id]
      );
    }
  } catch (error) {
    console.error(
      "Alert Engine Error:",
      error.message
    );
  }
}

module.exports = evaluateAlerts;