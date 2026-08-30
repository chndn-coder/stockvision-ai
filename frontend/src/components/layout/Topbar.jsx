import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

export default function Topbar() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getPageTitle = () => {
    if (location.pathname === "/") return "Dashboard";
    if (location.pathname === "/screener") return "AI Stock Screener";
    if (location.pathname === "/stocks") return "Stock Explorer";
    if (location.pathname === "/watchlist") return "My Watchlist";
    if (location.pathname === "/portfolio") return "Portfolio";
    if (location.pathname === "/alerts") return "Price Alerts";
    if (location.pathname.startsWith("/advisory")) return "AI Advisory";

    return "StockVision";
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="mobile-brand">StockVision</div>

        <div className="page-heading">
          <span>Workspace</span>
          <h1>{getPageTitle()}</h1>
        </div>
      </div>

      <div className="topbar-right">
        <div className="market-status">
          <span className="status-dot"></span>
          Markets connected
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}