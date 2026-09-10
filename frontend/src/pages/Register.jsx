import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import API from "../services/api";
import "./auth.css";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const navigate = useNavigate();

  const validateForm = () => {
    const cleanName = name.trim();

    if (cleanName.length < 2) {
      return "Name must contain at least 2 characters.";
    }

    if (cleanName.length > 50) {
      return "Name must be 50 characters or fewer.";
    }

    const namePattern =
      /^[A-Za-z][A-Za-z\s'-]*$/;

    if (!namePattern.test(cleanName)) {
      return "Name can contain letters, spaces, apostrophes and hyphens only.";
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      return "Enter a valid email address.";
    }

    if (password.length < 8) {
      return "Password must contain at least 8 characters.";
    }

    if (!/[A-Z]/.test(password)) {
      return "Password must contain an uppercase letter.";
    }

    if (!/[a-z]/.test(password)) {
      return "Password must contain a lowercase letter.";
    }

    if (!/[0-9]/.test(password)) {
      return "Password must contain a number.";
    }

    if (
      !/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(
        password
      )
    ) {
      return "Password must contain a special character.";
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

      await API.post("/auth/register", {
        name: name.trim(),
        email: email
          .trim()
          .toLowerCase(),
        password,
      });

      navigate("/login", {
        state: {
          registered: true,
        },
      });
    } catch (err) {
      console.error(
        "Registration error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">

        <section className="auth-brand-panel">
          <Link
            to="/login"
            className="auth-brand"
          >
            <span className="auth-brand-icon">
              S
            </span>

            <div>
              <strong>StockVision</strong>
              <small>
                AI Market Intelligence
              </small>
            </div>
          </Link>

          <div className="auth-brand-content">
            <span className="auth-eyebrow">
              YOUR MARKET WORKSPACE
            </span>

            <h1>
              Research, monitor and analyze
              stocks from one platform.
            </h1>

            <p>
              Create your StockVision account
              to build watchlists, monitor your
              portfolio, create alerts and use
              AI-powered stock screening.
            </p>

            <div className="auth-feature-list">
              <div>
                <span>⌕</span>
                <p>
                  <strong>
                    Natural-language screening
                  </strong>
                  <small>
                    Turn plain English into
                    structured stock filters.
                  </small>
                </p>
              </div>

              <div>
                <span>★</span>
                <p>
                  <strong>
                    Personal watchlist
                  </strong>
                  <small>
                    Keep important companies
                    within easy reach.
                  </small>
                </p>
              </div>

              <div>
                <span>◇</span>
                <p>
                  <strong>
                    Portfolio intelligence
                  </strong>
                  <small>
                    Track holdings and evaluate
                    market positions.
                  </small>
                </p>
              </div>
            </div>
          </div>

          <p className="auth-brand-footer">
            Your account keeps personal market
            tools separate from other users.
          </p>
        </section>

        <section className="auth-form-panel">
          <div className="auth-card">
            <div className="auth-card-heading">
              <span className="auth-eyebrow">
                GET STARTED
              </span>

              <h2>Create your account</h2>

              <p>
                Set up your StockVision
                workspace in a few seconds.
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
                <label htmlFor="register-name">
                  Full name
                </label>

                <input
                  id="register-name"
                  type="text"
                  placeholder="Chandan Kumar"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  autoComplete="name"
                  maxLength={50}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="register-email">
                  Email address
                </label>

                <input
                  id="register-email"
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
                <label htmlFor="register-password">
                  Password
                </label>

                <input
                  id="register-password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="new-password"
                />

                <p className="password-hint">
                  Use 8+ characters with uppercase,
                  lowercase, number and special
                  character.
                </p>
              </div>

              <button
                className="auth-submit-btn"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Creating account..."
                  : "Create Account"}
              </button>
            </form>

            <p className="auth-switch-text">
              Already have an account?{" "}
              <Link to="/login">
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}