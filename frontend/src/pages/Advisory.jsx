import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import API from "../services/api";
import Loader from "../components/ui/Loader";
import ErrorBanner from "../components/ui/ErrorBanner";

export default function Advisory() {
  const { symbol } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [searchSymbol, setSearchSymbol] =
    useState("");
  const [loading, setLoading] =
    useState(Boolean(symbol));
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAdvisory = async () => {
      try {
        setLoading(true);
        setError("");
        setData(null);

        const res = await API.get(
          `/advisory/${symbol}`
        );

        setData(res.data.data || null);
      } catch (err) {
        console.error(
          "Advisory error:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Failed to load stock advisory."
        );
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchAdvisory();
    } else {
      setLoading(false);
      setData(null);
      setError("");
    }
  }, [symbol]);

  const openAdvisory = () => {
    const normalizedSymbol =
      searchSymbol.trim().toUpperCase();

    if (!normalizedSymbol) {
      setError(
        "Enter a stock symbol to continue."
      );
      return;
    }

    if (
      !/^[A-Z0-9.-]{1,20}$/.test(
        normalizedSymbol
      )
    ) {
      setError(
        "Enter a valid stock symbol."
      );
      return;
    }

    navigate(
      `/advisory/${normalizedSymbol}`
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    openAdvisory();
  };

  /*
   * General Advisory landing page.
   *
   * This is shown when the user opens
   * /advisory from the sidebar.
   */
  if (!symbol) {
    return (
      <div className="advisory-page">
        <div className="advisory-selector">
          <div className="advisory-selector-copy">
            <span className="eyebrow">
              AI STOCK ANALYSIS
            </span>

            <h1>Analyze a Stock</h1>

            <p>
              Enter a stock symbol to generate
              StockVision&apos;s quantitative
              score, risk analysis and AI
              explanation.
            </p>
          </div>

          {error && (
            <ErrorBanner message={error} />
          )}

          <form
            className="advisory-selector-form"
            onSubmit={handleSubmit}
          >
            <label htmlFor="advisory-symbol">
              Stock Symbol
            </label>

            <div className="advisory-search-row">
              <input
                id="advisory-symbol"
                type="text"
                placeholder="Example: AAPL"
                value={searchSymbol}
                onChange={(event) => {
                  setSearchSymbol(
                    event.target.value
                  );

                  if (error) {
                    setError("");
                  }
                }}
                autoComplete="off"
              />

              <button type="submit">
                Analyze Stock
              </button>
            </div>
          </form>

          <div className="advisory-examples">
            <span>Try an example</span>

            <div className="advisory-example-list">
              {[
                "AAPL",
                "MSFT",
                "INFY",
                "TCS",
              ].map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/advisory/${example}`
                    )
                  }
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <div className="advisory-selector-note">
            <strong>
              How StockVision analyzes stocks
            </strong>

            <p>
              Financial metrics are evaluated
              using deterministic StockVision
              rules. AI is used as an
              explanation layer for the
              resulting analysis.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="advisory-page">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="advisory-page">
        <ErrorBanner message={error} />

        <div className="advisory-error-actions">
          <Link
            to="/advisory"
            className="advisory-back-link"
          >
            ← Analyze another stock
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="advisory-page">
        <ErrorBanner message="No advisory data available." />

        <div className="advisory-error-actions">
          <Link
            to="/advisory"
            className="advisory-back-link"
          >
            ← Analyze another stock
          </Link>
        </div>
      </div>
    );
  }

  const financials =
    data.financials || {};

  const quantitative =
    data.quantitativeAnalysis || {};

  const aiAdvisory =
    data.aiAdvisory || {};

  const score =
    quantitative.score ?? 0;

  const maxScore =
    quantitative.maxScore ?? 10;

  const riskLevel =
    quantitative.riskLevel ||
    "Unknown";

  const baselineRecommendation =
    quantitative.baselineRecommendation ||
    "N/A";

  const recommendation =
    aiAdvisory.recommendation ||
    baselineRecommendation;

  const confidence =
    typeof aiAdvisory.confidence ===
    "number"
      ? aiAdvisory.confidence
      : 0;

  const strengths =
    Array.isArray(
      aiAdvisory.strengths
    )
      ? aiAdvisory.strengths
      : [];

  const risks =
    Array.isArray(aiAdvisory.risks)
      ? aiAdvisory.risks
      : [];

  const getRecommendationClass = (
    value
  ) => {
    if (value === "BUY") return "buy";
    if (value === "SELL") return "sell";

    return "hold";
  };

  const formatValue = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "—";
    }

    return value;
  };

  return (
    <div className="advisory-page">

      {/* Page heading */}
      <div className="advisory-header">
        <div>
          <span className="eyebrow">
            AI STOCK ANALYSIS
          </span>

          <h1>
            {data.company ||
              data.symbol}
          </h1>

          <div className="advisory-company-meta">
            <span className="advisory-symbol">
              {data.symbol}
            </span>

            {data.sector && (
              <span className="advisory-sector">
                {data.sector}
              </span>
            )}
          </div>
        </div>

        <div className="advisory-header-actions">
          <Link
            to="/advisory"
            className="advisory-back-link"
          >
            Analyze Another
          </Link>

          <Link
            to="/stocks"
            className="advisory-back-link"
          >
            ← Back to Stocks
          </Link>
        </div>
      </div>

      {/* Main analysis cards */}
      <div className="advisory-top">

        <div className="score-card">
          <span className="advisory-card-label">
            StockVision Score
          </span>

          <div className="score-value">
            {score}
            <small>
              {" "}
              / {maxScore}
            </small>
          </div>

          <p>
            Deterministic quantitative
            score
          </p>
        </div>

        <div className="risk-card">
          <span className="advisory-card-label">
            Risk Level
          </span>

          <div className="advisory-card-value">
            <span
              className={`risk-badge ${riskLevel.toLowerCase()}`}
            >
              {riskLevel}
            </span>
          </div>

          <p>
            Based on StockVision
            financial rules
          </p>
        </div>

        <div className="recommendation-card">
          <span className="advisory-card-label">
            AI Recommendation
          </span>

          <div className="advisory-card-value">
            <span
              className={`recommendation-badge ${getRecommendationClass(
                recommendation
              )}`}
            >
              {recommendation}
            </span>
          </div>

          <p>
            Baseline:{" "}
            {baselineRecommendation}
          </p>
        </div>

      </div>

      {/* Financial data */}
      <section className="advisory-section">
        <div className="advisory-section-header">
          <div>
            <span className="eyebrow">
              FINANCIAL SNAPSHOT
            </span>

            <h2>
              Key Fundamentals
            </h2>
          </div>
        </div>

        <div className="financial-grid">

          <div className="financial-card">
            <span>Current Price</span>
            <strong>
              {formatValue(
                financials.currentPrice
              )}
            </strong>
          </div>

          <div className="financial-card">
            <span>P/E Ratio</span>
            <strong>
              {formatValue(
                financials.peRatio
              )}
            </strong>
          </div>

          <div className="financial-card">
            <span>PEG Ratio</span>
            <strong>
              {formatValue(
                financials.pegRatio
              )}
            </strong>
          </div>

          <div className="financial-card">
            <span>Market Cap</span>
            <strong>
              {formatValue(
                financials.marketCap
              )}
            </strong>
          </div>

          <div className="financial-card">
            <span>Revenue Growth</span>
            <strong>
              {formatValue(
                financials.revenueGrowth
              )}
            </strong>
          </div>

          <div className="financial-card">
            <span>EBITDA Growth</span>
            <strong>
              {formatValue(
                financials.ebitdaGrowth
              )}
            </strong>
          </div>

          <div className="financial-card">
            <span>Debt / FCF</span>
            <strong>
              {formatValue(
                financials.debtToFcf
              )}
            </strong>
          </div>

          <div className="financial-card">
            <span>Volume</span>
            <strong>
              {formatValue(
                financials.volume
              )}
            </strong>
          </div>

        </div>
      </section>

      {/* Confidence */}
      <section className="advisory-section">
        <div className="confidence-section">
          <div className="confidence-heading">
            <div>
              <span className="eyebrow">
                AI CONFIDENCE
              </span>

              <h2>
                Confidence Level
              </h2>
            </div>

            <strong>
              {confidence}%
            </strong>
          </div>

          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{
                width: `${Math.min(
                  Math.max(
                    confidence,
                    0
                  ),
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* AI summary */}
      <section className="summary-section">
        <span className="eyebrow">
          AI EXPLANATION
        </span>

        <h2>
          Investment Summary
        </h2>

        <p>
          {aiAdvisory.summary ||
            "No AI summary is available."}
        </p>
      </section>

      {/* Strengths and risks */}
      <div className="analysis-section">

        <section className="strengths">
          <span className="analysis-label positive">
            STRENGTHS
          </span>

          <h2>
            What Looks Positive
          </h2>

          {strengths.length > 0 ? (
            <ul>
              {strengths.map(
                (
                  strength,
                  index
                ) => (
                  <li
                    key={`${strength}-${index}`}
                  >
                    <span>✓</span>
                    {strength}
                  </li>
                )
              )}
            </ul>
          ) : (
            <p>
              No strengths available.
            </p>
          )}
        </section>

        <section className="risks">
          <span className="analysis-label warning">
            RISKS
          </span>

          <h2>
            What to Consider
          </h2>

          {risks.length > 0 ? (
            <ul>
              {risks.map(
                (risk, index) => (
                  <li
                    key={`${risk}-${index}`}
                  >
                    <span>!</span>
                    {risk}
                  </li>
                )
              )}
            </ul>
          ) : (
            <p>
              No risks available.
            </p>
          )}
        </section>

      </div>

      {/* Disclaimer */}
      <div className="advisory-disclaimer">
        <strong>
          Educational analysis only
        </strong>

        <p>
          {data.disclaimer ||
            "StockVision provides educational financial analysis and does not constitute personalized investment advice."}
        </p>
      </div>

    </div>
  );
}