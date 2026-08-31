import AIScreener from "../components/screener/AIScreener";
import ManualScreener from "../components/screener/ManualScreener";

export default function Screener() {
  return (
    <div className="page screener-page">

      {/* Main screener heading */}
      <div className="screener-page-header">
        <span className="eyebrow">STOCKVISION ANALYTICS</span>

        <h1>Stock Screener</h1>

        <p>
          Discover stocks using AI-powered natural language search
          or traditional financial filters.
        </p>
      </div>

      <AIScreener />

      <ManualScreener />

    </div>
  );
}
