const { Pool } = require("pg");

const isProduction =
  process.env.NODE_ENV === "production";

const getDatabaseUrl = () => {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const databaseUrl = new URL(
    process.env.DATABASE_URL
  );

  // SSL is configured explicitly below.
  databaseUrl.searchParams.delete("sslmode");

  return databaseUrl.toString();
};

const databaseUrl = getDatabaseUrl();

const poolConfig = databaseUrl
  ? {
      connectionString: databaseUrl,

      // Managed PostgreSQL providers such as Neon
      // require encrypted connections.
      ssl: isProduction
        ? { rejectUnauthorized: false }
        : false,
    }
  : {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port:
        Number(process.env.DB_PORT) ||
        5432,
    };

const pool = new Pool(poolConfig);

// Catch unexpected idle-client errors.
pool.on("error", (error) => {
  console.error(
    "Unexpected PostgreSQL pool error:",
    error
  );
});

module.exports = pool;