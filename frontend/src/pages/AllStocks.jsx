import { useEffect, useState } from "react";
import API from "../services/api";
import StockTable from "../components/ui/StockTable";
import Loader from "../components/ui/Loader";
import ErrorBanner from "../components/ui/ErrorBanner";

export default function AllStocks() {
  const [stocks, setStocks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load all stocks when the page opens
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await API.get("/stocks");

        setStocks(res.data.data || []);
      } catch (err) {
        console.error("All Stocks error:", err);
        setError("Failed to load stock data");
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  // Search by symbol or company name
  const filteredStocks = stocks.filter((stock) => {
    const searchText = search.toLowerCase();

    return (
      stock.symbol?.toLowerCase().includes(searchText) ||
      stock.company_name?.toLowerCase().includes(searchText)
    );
  });

  return (
    <div className="all-stocks-page">

      {/* Page heading */}
      <div className="stocks-page-header">
        <div>
          <p className="section-label">MARKET UNIVERSE</p>
          <h1>All Stocks</h1>
          <p className="page-description">
            Explore stocks available in the StockVision market universe.
          </p>
        </div>

        <div className="stock-count-card">
          <span>Total Stocks</span>
          <strong>{stocks.length}</strong>
        </div>
      </div>

      {/* Search area */}
      <div className="stocks-toolbar">
        <div className="stock-search">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search by symbol or company name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="search-result-count">
          {filteredStocks.length} stocks
        </div>
      </div>

      {/* Error message */}
      {error && <ErrorBanner message={error} />}

      {/* Loading state */}
      {loading && <Loader />}

      {/* Stock table */}
      {!loading && !error && (
        <div className="stocks-table-card">
          <div className="stocks-table-header">
            <div>
              <h2>Market Data</h2>
              <p>
                Current stock information available in StockVision
              </p>
            </div>
          </div>

          {filteredStocks.length > 0 ? (
            <StockTable stocks={filteredStocks} />
          ) : (
            <div className="stock-empty-state">
              <div className="empty-icon">⌕</div>
              <h3>No stocks found</h3>
              <p>
                Try searching with another symbol or company name.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}