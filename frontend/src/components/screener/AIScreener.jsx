import { useState } from "react";
import API from "../../services/api";
import StockTable from "../ui/StockTable";
import Loader from "../ui/Loader";
import ErrorBanner from "../ui/ErrorBanner";

export default function AIScreener() {
  const [query, setQuery] = useState("");
  const [stocks, setStocks] = useState([]);
  const [filters, setFilters] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const examples = [
    "Find stocks with PE below 30",
    "Find Technology stocks with PE below 25",
    "Find the top 5 stocks with PE below 30",
  ];

  const fieldLabels = {
    current_price: "Price",
    market_cap: "Market Cap",
    pe_ratio: "P/E Ratio",
    peg_ratio: "PEG Ratio",
    debt_to_fcf: "Debt / FCF",
    revenue_growth: "Revenue Growth",
    ebitda_growth: "EBITDA Growth",
    volume: "Volume",
  };

  const isMissing = (value) =>
    value === null ||
    value === undefined ||
    value === "";

  const formatCompactNumber = (value) => {
    const number = Number(value);

    if (Number.isNaN(number)) {
      return value;
    }

    if (Math.abs(number) >= 1_000_000_000_000) {
      return `${(
        number / 1_000_000_000_000
      ).toFixed(2)}T`;
    }

    if (Math.abs(number) >= 1_000_000_000) {
      return `${(
        number / 1_000_000_000
      ).toFixed(2)}B`;
    }

    if (Math.abs(number) >= 1_000_000) {
      return `${(
        number / 1_000_000
      ).toFixed(2)}M`;
    }

    if (Math.abs(number) >= 1_000) {
      return `${(
        number / 1_000
      ).toFixed(2)}K`;
    }

    return number.toLocaleString("en-US");
  };

  const formatFilterValue = (
    field,
    value
  ) => {
    if (isMissing(value)) {
      return "—";
    }

    // Support "between" filters if the
    // backend returns two values.
    if (Array.isArray(value)) {
      return value
        .map((item) =>
          formatFilterValue(field, item)
        )
        .join(" and ");
    }

    const number = Number(value);

    if (
      field === "revenue_growth" ||
      field === "ebitda_growth"
    ) {
      if (Number.isNaN(number)) {
        return value;
      }

      return `${(
        number * 100
      ).toFixed(2)}%`;
    }

    if (field === "current_price") {
      if (Number.isNaN(number)) {
        return value;
      }

      return `$${number.toLocaleString(
        "en-US",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}`;
    }

    if (field === "market_cap") {
      if (Number.isNaN(number)) {
        return value;
      }

      return `$${formatCompactNumber(
        number
      )}`;
    }

    if (field === "volume") {
      if (Number.isNaN(number)) {
        return value;
      }

      return formatCompactNumber(number);
    }

    if (
      field === "pe_ratio" ||
      field === "peg_ratio" ||
      field === "debt_to_fcf"
    ) {
      if (Number.isNaN(number)) {
        return value;
      }

      return number.toFixed(2);
    }

    return value;
  };

  const getFieldLabel = (field) =>
    fieldLabels[field] || field;

  const runAI = async () => {
    // Do not send an empty request
    if (!query.trim()) {
      setError(
        "Please describe the stocks you are looking for."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setStocks([]);
      setFilters(null);

      // Send the natural-language request
      const res = await API.post(
        "/stocks/ai-screener",
        {
          query: query.trim(),
        }
      );

      setStocks(
        res.data.data || []
      );

      setFilters(
        res.data.filtersApplied || null
      );
    } catch (err) {
      console.error(
        "AI Screener error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to run the AI screener. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExample = (example) => {
    setQuery(example);
    setError("");
  };

  const handleKeyDown = (event) => {
    // Ctrl + Enter runs the screener
    if (
      event.ctrlKey &&
      event.key === "Enter"
    ) {
      runAI();
    }
  };

  return (
    <section className="ai-screener-card">

      {/* AI screener introduction */}
      <div className="ai-screener-header">
        <div>
          <span className="eyebrow">
            AI-POWERED SEARCH
          </span>

          <h2>
            Find Stocks in Plain English
          </h2>

          <p>
            Describe the stocks you are
            looking for and StockVision
            will translate your request
            into financial screening
            rules.
          </p>
        </div>

        <div className="ai-status">
          <span className="status-dot"></span>
          AI Engine Ready
        </div>
      </div>

      {/* Natural language input */}
      <div className="ai-input-area">

        <textarea
          value={query}
          onChange={(event) => {
            setQuery(
              event.target.value
            );

            if (error) {
              setError("");
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Example: Find Technology stocks with PE below 30"
          disabled={loading}
        />

        <div className="ai-input-footer">
          <span>
            Press{" "}
            <strong>
              Ctrl + Enter
            </strong>{" "}
            to run
          </span>

          <button
            className="ai-run-button"
            onClick={runAI}
            disabled={loading}
          >
            {loading
              ? "Analyzing..."
              : "Run AI Screener →"}
          </button>
        </div>

      </div>

      {/* Example queries */}
      <div className="example-section">

        <span>Try an example</span>

        <div className="example-buttons">
          {examples.map((example) => (
            <button
              key={example}
              className="example-button"
              onClick={() =>
                handleExample(example)
              }
              disabled={loading}
            >
              {example}
            </button>
          ))}
        </div>

      </div>

      {/* Loading state */}
      {loading && (
        <div className="ai-loading">
          <Loader />

          <p>
            AI is translating your
            request into screening
            rules...
          </p>
        </div>
      )}

      {/* Error message */}
      {!loading && error && (
        <ErrorBanner
          message={error}
        />
      )}

      {/* Screening results */}
      {!loading &&
        stocks.length > 0 && (
          <div className="ai-results">

            <div className="results-header">
              <div>
                <span className="eyebrow">
                  SCREENING RESULTS
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
            </div>

            {/* Rules generated by AI */}
            {filters && (
              <div className="filters-applied">

                <div className="filters-title">
                  <span>
                    AI-generated filters
                  </span>
                </div>

                <div className="filter-list">

                  {filters.filters?.map(
                    (filter, index) => (
                      <span
                        className="filter-chip"
                        key={`${filter.field}-${index}`}
                      >
                        {getFieldLabel(
                          filter.field
                        )}{" "}
                        {filter.operator}{" "}
                        {formatFilterValue(
                          filter.field,
                          filter.value
                        )}
                      </span>
                    )
                  )}

                  {filters.sector && (
                    <span className="filter-chip">
                      Sector:{" "}
                      {filters.sector}
                    </span>
                  )}

                  {filters.limit && (
                    <span className="filter-chip">
                      Top {filters.limit}
                    </span>
                  )}

                  {filters.sort && (
                    <span className="filter-chip">
                      Sort:{" "}
                      {getFieldLabel(
                        filters.sort.field
                      )}{" "}
                      {filters.sort.direction?.toUpperCase()}
                    </span>
                  )}

                </div>
              </div>
            )}

            <StockTable
              stocks={stocks}
            />

          </div>
        )}

      {/* Empty state */}
      {!loading &&
        !error &&
        stocks.length === 0 && (
          <div className="ai-empty-state">
            <div className="empty-icon">
              ✦
            </div>

            <h3>
              Start your stock search
            </h3>

            <p>
              Tell StockVision what kind
              of companies you want to
              find.
            </p>
          </div>
        )}

    </section>
  );
}