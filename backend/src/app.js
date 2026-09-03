const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const stockRoutes = require("./routes/stockRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const authRoutes = require("./routes/authRoutes");
const alertRoutes = require("./routes/alertRoutes");
const advisoryRoutes = require("./routes/advisoryRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");

const app = express();

/* ==========================
   SECURITY
========================== */

app.use(helmet());

const allowedOrigins = (
  process.env.CLIENT_URL || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin(origin, callback) {
      // Allow tools such as Postman and server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

/* ==========================
   RATE LIMITING
========================== */

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

app.use("/api", apiLimiter);

/* ==========================
   REQUEST PARSING
========================== */

app.use(
  express.json({
    limit: "1mb",
  })
);

/* ==========================
   HEALTH CHECK
========================== */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "StockVision Backend Running",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "stockvision-api",
    status: "healthy",
    environment: process.env.NODE_ENV || "development",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

/* ==========================
   API ROUTES
========================== */

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/advisory", advisoryRoutes);
app.use("/api/watchlist", watchlistRoutes);

/* ==========================
   NOT FOUND
========================== */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* ==========================
   GLOBAL ERROR HANDLER
========================== */

app.use((err, req, res, next) => {
  console.error("Global Error:", err);

  const isProduction =
    process.env.NODE_ENV === "production";

  res.status(err.status || 500).json({
    success: false,
    message: isProduction
      ? "Internal Server Error"
      : err.message || "Internal Server Error",
  });
});

module.exports = app;



