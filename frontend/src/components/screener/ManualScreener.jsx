import { useState } from "react";
import API from "../../services/api";
import StockTable from "../ui/StockTable";
import Loader from "../ui/Loader";
import ErrorBanner from "../ui/ErrorBanner";

export default function ManualScreener() {
  const [pe, setPe] = useState("");
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] =
    useState(false);

  const runManual = async () => {
    const value = pe.trim();

    if (!value) {
      setError("Enter a maximum P/E ratio.");
      return;
    }

    const numericPe = Number(value);

    if (
      Number.isNaN(numericPe) ||
      numericPe <= 0
    ) {
      setError(
        "Enter a valid P/E ratio greater than 0."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setStocks([]);
      setHasSearched(true);

      const res = await API.get(
        "/stocks/screener",
        {
          params: {
            pe: numericPe,
          },
        }
      );

      setStocks(
        res.data.data || []
      );
    } catch (err) {
      console.error(
        "Manual Screener error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to run the screener. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      runManual();
    }
  };

  return (
    <section className="manual-screener-card">
      <div className="manual-screener-header">
        <div>
          <span className="eyebrow">
            QUICK FILTER
          </span>

          <h2>
            Manual Stock Screener
          </h2>

          <p>
            Filter the market instantly
            using a maximum P/E ratio.
          </p>
        </div>

        <div className="manual-status">
          <span className="status-dot"></span>
          Rule Based
        </div>
      </div>

      <div className="manual-screener-form">
        <div className="manual-input-group">
          <label htmlFor="manual-pe">
            Maximum P/E Ratio
          </label>

          <input
            id="manual-pe"
            type="number"
            min="0"
            step="0.01"
            placeholder="Example: 25"
            value={pe}
            onChange={(event) => {
              setPe(
                event.target.value
              );

              if (error) {
                setError("");
              }
            }}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />

          <span className="manual-helper">
            Lower values generally
            narrow the results to
            cheaper-valued stocks.
          </span>
        </div>

        <button
          className="manual-filter-button"
          onClick={runManual}
          disabled={loading}
        >
          {loading
            ? "Filtering..."
            : "Apply Filter →"}
        </button>
      </div>

      {loading && (
        <div className="manual-loading">
          <Loader />

          <p>
            Screening stocks...
          </p>
        </div>
      )}

      {!loading && error && (
        <ErrorBanner
          message={error}
        />
      )}

      {!loading &&
        !error &&
        stocks.length > 0 && (
          <div className="manual-results">
            <div className="manual-results-header">
              <div>
                <span className="eyebrow">
                  FILTER RESULTS
                </span>

                <h3>
                  {stocks.length}{" "}
                  stock
                  {stocks.length !== 1
                    ? "s"
                    : ""}{" "}
                  found
                </h3>
              </div>

              <span className="manual-filter-summary">
                P/E ≤ {pe}
              </span>
            </div>

            <StockTable
              stocks={stocks}
            />
          </div>
        )}

      {!loading &&
        !error &&
        hasSearched &&
        stocks.length === 0 && (
          <div className="manual-empty-state">
            <div className="empty-icon">
              ⌕
            </div>

            <h3>
              No matching stocks
            </h3>

            <p>
              Try increasing the maximum
              P/E ratio.
            </p>
          </div>
        )}
    </section>
  );
}