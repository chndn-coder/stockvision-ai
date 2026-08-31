import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    stocks: 0,
    alerts: 0,
  });

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get the stock list for the dashboard
        const stocksRes = await API.get("/stocks");

        // Get the user's alerts
        const alertsRes = await API.get("/alerts");

        const stockData = stocksRes.data.data || [];
        const alertData = alertsRes.data.alerts || [];

        setStats({
          stocks: stocksRes.data.count || stockData.length,
          alerts: alertData.length,
        });

        // Show only a few stocks on the dashboard
        setStocks(stockData.slice(0, 5));
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="page dashboard-page">
        <div className="dashboard-loading">
          Loading your StockVision dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="page dashboard-page">

      {/* Dashboard heading */}
      <div className="dashboard-header">
        <div>
          <span className="eyebrow">MARKET INTELLIGENCE</span>
          <h1>StockVision Dashboard</h1>
          <p>
            Monitor your market universe and discover opportunities
            using AI-powered analysis.
          </p>
        </div>

        <Link to="/screener" className="primary-action">
          Open AI Screener →
        </Link>
      </div>

      {/* Main statistics */}
      <div className="dashboard-cards">

        <div className="dashboard-stat-card">
          <div className="stat-icon">◈</div>

          <div>
            <span>Total Stocks</span>
            <strong>{stats.stocks}</strong>
            <small>Available in StockVision</small>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon">✦</div>

          <div>
            <span>AI Analysis</span>
            <strong>Ready</strong>
            <small>Natural language screening</small>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon">◉</div>

          <div>
            <span>Active Alerts</span>
            <strong>{stats.alerts}</strong>
            <small>Your monitored stocks</small>
          </div>
        </div>

      </div>

      {/* Intelligence section */}
      <div className="dashboard-section">

        <div className="section-heading">
          <div>
            <span className="eyebrow">STOCKVISION TOOLS</span>
            <h2>Market Intelligence</h2>
          </div>
        </div>

        <div className="quick-actions">

          <Link to="/screener" className="quick-action-card">
            <div className="quick-action-icon">⌕</div>
            <div>
              <h3>AI Screener</h3>
              <p>
                Describe the stocks you want in plain English.
              </p>
            </div>
            <span>→</span>
          </Link>

          <Link to="/stocks" className="quick-action-card">
            <div className="quick-action-icon">▦</div>
            <div>
              <h3>Explore Stocks</h3>
              <p>
                Browse the complete StockVision market universe.
              </p>
            </div>
            <span>→</span>
          </Link>

          <Link to="/watchlist" className="quick-action-card">
            <div className="quick-action-icon">☆</div>
            <div>
              <h3>Your Watchlist</h3>
              <p>
                Keep track of stocks you want to monitor.
              </p>
            </div>
            <span>→</span>
          </Link>

        </div>
      </div>

      {/* Recent stocks */}
      <div className="dashboard-section">

        <div className="section-heading">
          <div>
            <span className="eyebrow">MARKET UNIVERSE</span>
            <h2>Recent Stock Data</h2>
          </div>

          <Link to="/stocks" className="section-link">
            View all →
          </Link>
        </div>

        <div className="dashboard-table-wrapper">

          {stocks.length === 0 ? (
            <div className="empty-box">
              No stock data available.
            </div>
          ) : (
            <table className="dashboard-table">

              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company</th>
                  <th>Price</th>
                  <th>P/E Ratio</th>
                  <th>Market Cap</th>
                </tr>
              </thead>

              <tbody>
                {stocks.map((stock) => (
                  <tr key={stock.symbol}>

                    <td>
                      <span className="dashboard-symbol">
                        {stock.symbol}
                      </span>
                    </td>

                    <td>{stock.company_name}</td>

                    <td>
                      {stock.current_price}
                    </td>

                    <td>
                      {stock.pe_ratio ?? "—"}
                    </td>

                    <td>
                      {stock.market_cap ?? "—"}
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          )}

        </div>
      </div>

    </div>
  );
}