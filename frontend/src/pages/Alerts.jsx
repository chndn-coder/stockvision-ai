import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import API from "../services/api";
import Loader from "../components/ui/Loader";
import ErrorBanner from "../components/ui/ErrorBanner";

export default function Alerts() {
  const location = useLocation();

  const prefillSymbol =
    location.state?.symbol || "";

  const [alerts, setAlerts] = useState([]);

  const [form, setForm] = useState({
    name: "",
    symbol: prefillSymbol,
    operator: ">=",
    targetPrice: "",
  });

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");

  // Load saved alerts
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get("/alerts");

      setAlerts(res.data.alerts || []);
    } catch (err) {
      console.error("Alerts error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load alerts."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // Create a new price alert
  const createAlert = async () => {
    if (
      !form.name.trim() ||
      !form.symbol.trim() ||
      !form.targetPrice
    ) {
      setError(
        "Please fill in all alert fields."
      );
      return;
    }

    if (Number(form.targetPrice) <= 0) {
      setError(
        "Target price must be greater than 0."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const res = await API.post("/alerts", {
        name: form.name.trim(),
        symbol: form.symbol
          .trim()
          .toUpperCase(),
        operator: form.operator,
        targetPrice: Number(
          form.targetPrice
        ),
      });

      setSuccess(
        res.data.message ||
          "Alert created successfully"
      );

      setForm({
        name: "",
        symbol: "",
        operator: ">=",
        targetPrice: "",
      });

      await fetchAlerts();
    } catch (err) {
      console.error(
        "Create alert error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to create alert."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Delete an alert
  const deleteAlert = async (id) => {
    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      const res = await API.delete(
        `/alerts/${id}`
      );

      setAlerts((current) =>
        current.filter(
          (alert) => alert.id !== id
        )
      );

      setSuccess(
        res.data.message ||
          "Alert deleted"
      );
    } catch (err) {
      console.error(
        "Delete alert error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete alert."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getConditionText = (alert) => {
    const dsl = alert.dsl;

    if (!dsl) {
      return "Alert condition unavailable";
    }

    const condition =
      dsl.operator === ">="
        ? "rises to or above"
        : "falls to or below";

    return `${dsl.symbol} ${condition} ${dsl.targetPrice}`;
  };

  return (
    <div className="alerts-page">

      {/* Page heading */}
      <div className="alerts-header">
        <div>
          <p className="section-label">
            MARKET MONITORING
          </p>

          <h1>Price Alerts</h1>

          <p className="page-description">
            Monitor stock prices and let
            StockVision track your target
            conditions.
          </p>
        </div>

        <div className="alerts-count-card">
          <span>Active Alerts</span>
          <strong>{alerts.length}</strong>
        </div>
      </div>

      {error && (
        <ErrorBanner message={error} />
      )}

      {success && (
        <div className="alerts-success">
          {success}
        </div>
      )}

      <div className="alerts-layout">

        {/* Create alert */}
        <section className="create-alert-card">

          <p className="section-label">
            NEW ALERT
          </p>

          <h2>Create Price Alert</h2>

          <p className="alert-form-description">
            Choose a stock and a target price.
            StockVision checks active alerts
            automatically.
          </p>

          <label>
            Alert Name

            <input
              name="name"
              placeholder="Example: AAPL target"
              value={form.name}
              onChange={handleChange}
              disabled={submitting}
            />
          </label>

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
            Condition

            <select
              name="operator"
              value={form.operator}
              onChange={handleChange}
              disabled={submitting}
            >
              <option value=">=">
                Price rises to or above
              </option>

              <option value="<=">
                Price falls to or below
              </option>
            </select>
          </label>

          <label>
            Target Price

            <input
              name="targetPrice"
              type="number"
              min="0"
              step="any"
              placeholder="Example: 350"
              value={form.targetPrice}
              onChange={handleChange}
              disabled={submitting}
            />
          </label>

          <button
            className="create-alert-btn"
            onClick={createAlert}
            disabled={submitting}
          >
            {submitting
              ? "Creating..."
              : "Create Price Alert"}
          </button>
        </section>

        {/* Existing alerts */}
        <section className="alerts-list-card">

          <div className="alerts-list-header">
            <div>
              <p className="section-label">
                ACTIVE MONITORING
              </p>

              <h2>Your Alerts</h2>
            </div>

            <span>
              Checked automatically
            </span>
          </div>

          {loading ? (
            <div className="alerts-loader">
              <Loader />
              <p>Loading your alerts...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="alerts-empty">
              <div className="alerts-empty-icon">
                ◉
              </div>

              <h3>No price alerts yet</h3>

              <p>
                Create your first alert to
                start monitoring a stock.
              </p>
            </div>
          ) : (
            <div className="alerts-list">
              {alerts.map((alert) => (
                <article
                  className="alert-card"
                  key={alert.id}
                >
                  <div className="alert-status-icon">
                    ◉
                  </div>

                  <div className="alert-content">
                    <div className="alert-name-row">
                      <strong>
                        {alert.name}
                      </strong>

                      <span className="alert-active-badge">
                        Active
                      </span>
                    </div>

                    <p className="alert-condition">
                      {getConditionText(
                        alert
                      )}
                    </p>

                    <p className="trigger-time">
                      Last triggered:{" "}
                      {alert.last_triggered_at
                        ? new Date(
                            alert.last_triggered_at
                          ).toLocaleString()
                        : "Never"}
                    </p>
                  </div>

                  <button
                    className="alert-delete-btn"
                    onClick={() =>
                      deleteAlert(alert.id)
                    }
                    disabled={
                      deletingId === alert.id
                    }
                  >
                    {deletingId === alert.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}