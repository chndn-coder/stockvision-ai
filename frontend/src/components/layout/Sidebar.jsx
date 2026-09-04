import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">S</div>

        <div>
          <h2>StockVision</h2>
          <span>AI Market Intelligence</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-section-title">MAIN</p>

        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>⌂</span>
          Dashboard
        </NavLink>

        <NavLink
          to="/screener"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>⌕</span>
          AI Screener
        </NavLink>

        <NavLink
          to="/stocks"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>▦</span>
          All Stocks
        </NavLink>

        <p className="nav-section-title">MY PORTFOLIO</p>

        <NavLink
          to="/watchlist"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>★</span>
          Watchlist
        </NavLink>

        <NavLink
          to="/portfolio"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>◈</span>
          Portfolio
        </NavLink>

        <NavLink
          to="/alerts"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>◉</span>
          Alerts
        </NavLink>

        <p className="nav-section-title">AI TOOLS</p>

        <NavLink
          to="/advisory"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>✦</span>
          AI Advisory
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="status-dot"></div>
        <div>
          <strong>StockVision AI</strong>
          <span>System Online</span>
        </div>
      </div>
    </aside>
  );
}
