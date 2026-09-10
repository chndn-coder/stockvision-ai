import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";
import "./auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email.trim()) {
      return "Email is required.";
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      return "Enter a valid email address.";
    }

    if (!password) {
      return "Password is required.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await API.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const token = res.data.token;

      if (!token) {
        throw new Error("No token received");
      }

      login(token);
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to sign in. Check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">

        <section className="auth-brand-panel">
          <Link to="/login" className="auth-brand">
            <span className="auth-brand-icon">S</span>

            <div>
              <strong>StockVision</strong>
              <small>AI Market Intelligence</small>
            </div>
          </Link>

          <div className="auth-brand-content">
            <span className="auth-eyebrow">
              SMARTER STOCK ANALYSIS
            </span>

            <h1>
              Make market research easier with StockVision AI.
            </h1>

            <p>
              Screen stocks using plain English, monitor your
              portfolio, create price alerts and receive
              AI-assisted market analysis from one dashboard.
            </p>

            <div className="auth-feature-list">
              <div>
                <span>⌕</span>
                <p>
                  <strong>AI Stock Screener</strong>
                  <small>
                    Find stocks using natural-language queries.
                  </small>
                </p>
              </div>

              <div>
                <span>◇</span>
                <p>
                  <strong>Portfolio Tracking</strong>
                  <small>
                    Monitor holdings, value and profit or loss.
                  </small>
                </p>
              </div>

              <div>
                <span>◎</span>
                <p>
                  <strong>Alerts & Advisory</strong>
                  <small>
                    Track price targets and analyze stocks.
                  </small>
                </p>
              </div>
            </div>
          </div>

          <p className="auth-brand-footer">
            Built for learning, research and market exploration.
          </p>
        </section>

        <section className="auth-form-panel">
          <div className="auth-card">
            <div className="auth-card-heading">
              <span className="auth-eyebrow">
                WELCOME BACK
              </span>

              <h2>Sign in to StockVision</h2>

              <p>
                Continue to your market intelligence workspace.
              </p>
            </div>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <form
              className="auth-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="auth-field">
                <label htmlFor="login-email">
                  Email address
                </label>

                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="login-password">
                  Password
                </label>

                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="current-password"
                />
              </div>

              <button
                className="auth-submit-btn"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Signing in..."
                  : "Sign In"}
              </button>
            </form>

            <p className="auth-switch-text">
              New to StockVision?{" "}
              <Link to="/register">
                Create an account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}