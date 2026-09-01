import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import Loader from "../components/ui/Loader";
import ErrorBanner from "../components/ui/ErrorBanner";

export default function Watchlist() {
  const [stocks, setStocks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load saved stocks
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await API.get("/watchlist");

        setStocks(res.data.data || []);
      } catch (err) {
        console.error("Watchlist error:", err);
        setError("Failed to load your watchlist.");
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, []);

  // Search saved stocks
  const filteredStocks = stocks.filter((stock) => {
    const searchText = search.toLowerCase();

    return (
      stock.symbol?.toLowerCase().includes(searchText) ||
      stock.company_name?.toLowerCase().includes(searchText)
    );
  });

  return (
    <div className="watchlist-page">

      {/* Page heading */}
      <div className="watchlist-header">
        <div>
          <p className="section-label">MY MARKET</p>

          <h1>Watchlist</h1>

          <p className="page-description">
            Track the companies you want to monitor and open their
            StockVision AI analysis whenever you need it.
          </p>
        </div>

        <div className="watchlist-count-card">
          <span>Saved Stocks</span>
          <strong>{stocks.length}</strong>
        </div>
      </div>

      {/* Search */}
      {!loading && stocks.length > 0 && (
        <div className="watchlist-toolbar">
          <div className="watchlist-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search your watchlist..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <span className="watchlist-result-count">
            {filteredStocks.length} shown
          </span>
        </div>
      )}

      {loading && (
        <div className="watchlist-loader">
          <Loader />
          <p>Loading your watchlist...</p>
        </div>
      )}

      {!loading && error && (
        <ErrorBanner message={error} />
      )}

      {/* No saved stocks yet */}
      {!loading && !error && stocks.length === 0 && (
        <div className="watchlist-empty">
          <div className="watchlist-empty-icon">☆</div>

          <h2>Your watchlist is empty</h2>

          <p>
            Add companies from Stock Explorer or the AI Screener
            to start tracking them here.
          </p>

          <div className="watchlist-empty-actions">
            <Link to="/stocks" className="watchlist-primary-link">
              Explore Stocks
            </Link>

            <Link to="/screener" className="watchlist-secondary-link">
              Use AI Screener
            </Link>
          </div>
        </div>
      )}

      {/* No search match */}
      {!loading &&
        !error &&
        stocks.length > 0 &&
        filteredStocks.length === 0 && (
          <div className="watchlist-empty">
            <div className="watchlist-empty-icon">⌕</div>

            <h2>No matching stocks</h2>

            <p>
              Try searching with another company name or symbol.
            </p>
          </div>
        )}

      {/* Saved stocks */}
      {!loading &&
        !error &&
        filteredStocks.length > 0 && (
          <div className="watchlist-grid">
            {filteredStocks.map((stock) => (
              <article
                className="watchlist-stock-card"
                key={stock.symbol}
              >
                <div className="watchlist-stock-top">
                  <div className="watchlist-symbol-box">
                    {stock.symbol?.charAt(0)}
                  </div>

                  <div className="watchlist-company">
                    <strong>{stock.symbol}</strong>
                    <span>{stock.company_name}</span>
                  </div>

                  <span className="watchlist-saved-badge">
                    ★ Watching
                  </span>
                </div>

                <div className="watchlist-price-section">
                  <span>Current Price</span>

                  <strong>
                    {stock.current_price ?? "—"}
                  </strong>
                </div>

                <div className="watchlist-card-footer">
                  <Link
                    to={`/advisory/${stock.symbol}`}
                    className="watchlist-advisory-link"
                  >
                    ✦ AI Advisory
                  </Link>

                  <Link
                    to="/alerts"
                    state={{ symbol: stock.symbol }}
                    className="watchlist-alert-link"
                  >
                    Create Alert
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
    </div>
  );
}