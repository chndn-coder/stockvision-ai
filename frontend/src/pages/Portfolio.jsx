import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import Loader from "../components/ui/Loader";
import ErrorBanner from "../components/ui/ErrorBanner";

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);
  const [deletingId, setDeletingId] =
    useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    symbol: "",
    quantity: "",
    buy_price: "",
  });

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get("/portfolio");

      setPortfolio(res.data.holdings || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error("Portfolio error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load portfolio."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const addStock = async () => {
    if (
      !form.symbol.trim() ||
      !form.quantity ||
      !form.buy_price
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (Number(form.quantity) <= 0) {
      setError(
        "Quantity must be greater than 0."
      );
      return;
    }

    if (Number(form.buy_price) <= 0) {
      setError(
        "Buy price must be greater than 0."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const res = await API.post("/portfolio", {
        symbol: form.symbol.trim().toUpperCase(),
        quantity: Number(form.quantity),
        buy_price: Number(form.buy_price),
      });

      setForm({
        symbol: "",
        quantity: "",
        buy_price: "",
      });

      setSuccess(
        res.data.message ||
          "Holding added successfully"
      );

      await fetchPortfolio();
    } catch (err) {
      console.error(
        "Portfolio add error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to add stock."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deleteStock = async (id) => {
    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      const res = await API.delete(
        `/portfolio/${id}`
      );

      setSuccess(
        res.data.message ||
          "Holding removed"
      );

      await fetchPortfolio();
    } catch (err) {
      console.error(
        "Portfolio delete error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to remove holding."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const formatNumber = (value) => {
    const number = Number(value || 0);

    return number.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getProfitClass = (value) => {
    const number = Number(value || 0);

    if (number > 0) return "positive";
    if (number < 0) return "negative";

    return "neutral";
  };

  const totalInvested =
    Number(summary?.totalInvested || 0);

  const totalCurrent =
    Number(summary?.totalCurrent || 0);

  const totalProfitLoss =
    Number(summary?.totalProfitLoss || 0);

  const totalReturnPercent =
    Number(summary?.totalReturnPercent || 0);

  return (
    <div className="portfolio-page">

      {/* Page heading */}
      <div className="portfolio-header">
        <div>
          <p className="section-label">
            MY INVESTMENTS
          </p>

          <h1>Portfolio</h1>

          <p className="page-description">
            Track your holdings, invested value and
            current profit or loss.
          </p>
        </div>

        <div className="portfolio-holding-count">
          <span>Holdings</span>
          <strong>{portfolio.length}</strong>
        </div>
      </div>

      {error && (
        <ErrorBanner message={error} />
      )}

      {success && (
        <div className="portfolio-success">
          {success}
        </div>
      )}

      {loading ? (
        <div className="portfolio-loader">
          <Loader />
          <p>Loading your portfolio...</p>
        </div>
      ) : (
        <>
          {/* Portfolio summary */}
          <div className="portfolio-summary-grid">

            <div className="portfolio-summary-card">
              <span>Total Invested</span>

              <strong>
                ${formatNumber(totalInvested)}
              </strong>

              <small>
                Cost of your holdings
              </small>
            </div>

            <div className="portfolio-summary-card">
              <span>Current Value</span>

              <strong>
                ${formatNumber(totalCurrent)}
              </strong>

              <small>
                Based on current stock prices
              </small>
            </div>

            <div className="portfolio-summary-card">
              <span>Total P/L</span>

              <strong
                className={getProfitClass(
                  totalProfitLoss
                )}
              >
                {totalProfitLoss >= 0
                  ? "+"
                  : ""}
                ${formatNumber(totalProfitLoss)}
              </strong>

              <small>
                Unrealized profit or loss
              </small>
            </div>

            <div className="portfolio-summary-card">
              <span>Total Return</span>

              <strong
                className={getProfitClass(
                  totalReturnPercent
                )}
              >
                {totalReturnPercent >= 0
                  ? "+"
                  : ""}
                {formatNumber(
                  totalReturnPercent
                )}
                %
              </strong>

              <small>
                Portfolio performance
              </small>
            </div>

          </div>

          <div className="portfolio-layout">

            {/* Add holding */}
            <section className="portfolio-add-card">

              <p className="section-label">
                ADD INVESTMENT
              </p>

              <h2>Add Holding</h2>

              <p className="portfolio-form-description">
                Enter a stock you own and the
                price you paid for it.
              </p>

              <label>
                Stock Symbol

                <input
                  name="symbol"
                  placeholder="Example: AAPL"
                  value={form.symbol}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </label>

              <label>
                Quantity

                <input
                  name="quantity"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Example: 10"
                  value={form.quantity}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </label>

              <label>
                Buy Price

                <input
                  name="buy_price"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Example: 180"
                  value={form.buy_price}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </label>

              <button
                className="portfolio-add-btn"
                onClick={addStock}
                disabled={submitting}
              >
                {submitting
                  ? "Adding..."
                  : "Add to Portfolio"}
              </button>

            </section>

            {/* Holdings */}
            <section className="portfolio-holdings-card">

              <div className="portfolio-section-header">
                <div>
                  <p className="section-label">
                    CURRENT HOLDINGS
                  </p>

                  <h2>Your Investments</h2>
                </div>
              </div>

              {portfolio.length === 0 ? (
                <div className="portfolio-empty">
                  <div className="portfolio-empty-icon">
                    ◇
                  </div>

                  <h3>No holdings yet</h3>

                  <p>
                    Add your first stock to begin
                    tracking your portfolio.
                  </p>

                  <Link
                    to="/stocks"
                    className="portfolio-explore-link"
                  >
                    Explore Stocks
                  </Link>
                </div>
              ) : (
                <div className="portfolio-table-wrapper">
                  <table className="portfolio-table">

                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Quantity</th>
                        <th>Buy Price</th>
                        <th>Current</th>
                        <th>Invested</th>
                        <th>Current Value</th>
                        <th>P/L</th>
                        <th></th>
                      </tr>
                    </thead>

                    <tbody>
                      {portfolio.map((holding) => {
                        const profitLoss =
                          Number(
                            holding.profit_loss || 0
                          );

                        return (
                          <tr key={holding.id}>
                            <td>
                              <div className="portfolio-company">
                                <strong>
                                  {holding.symbol}
                                </strong>

                                <span>
                                  {holding.company_name}
                                </span>
                              </div>
                            </td>

                            <td>
                              {holding.quantity}
                            </td>

                            <td>
                              $
                              {formatNumber(
                                holding.buy_price
                              )}
                            </td>

                            <td>
                              $
                              {formatNumber(
                                holding.current_price
                              )}
                            </td>

                            <td>
                              $
                              {formatNumber(
                                holding.invested_value
                              )}
                            </td>

                            <td>
                              $
                              {formatNumber(
                                holding.current_value
                              )}
                            </td>

                            <td>
                              <span
                                className={`portfolio-pl ${getProfitClass(
                                  profitLoss
                                )}`}
                              >
                                {profitLoss >= 0
                                  ? "+"
                                  : ""}
                                $
                                {formatNumber(
                                  profitLoss
                                )}
                              </span>
                            </td>

                            <td>
                              <button
                                className="portfolio-delete-btn"
                                onClick={() =>
                                  deleteStock(
                                    holding.id
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  holding.id
                                }
                              >
                                {deletingId ===
                                holding.id
                                  ? "..."
                                  : "Remove"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>

                  </table>
                </div>
              )}
            </section>

          </div>
        </>
      )}
    </div>
  );
}