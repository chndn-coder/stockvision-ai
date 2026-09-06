import API from "../../services/api";

export default function StockTable({ stocks }) {
  const formatPrice = (value) => {
    if (value === null || value === undefined) {
      return "—";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
      return "—";
    }

    return `$${number.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatRatio = (value) => {
    if (value === null || value === undefined) {
      return "—";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
      return "—";
    }

    return number.toFixed(2);
  };

  const formatMarketCap = (value) => {
    if (value === null || value === undefined) {
      return "—";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
      return "—";
    }

    if (number >= 1_000_000_000_000) {
      return `$${(number / 1_000_000_000_000).toFixed(2)}T`;
    }

    if (number >= 1_000_000_000) {
      return `$${(number / 1_000_000_000).toFixed(2)}B`;
    }

    if (number >= 1_000_000) {
      return `$${(number / 1_000_000).toFixed(2)}M`;
    }

    return `$${number.toLocaleString("en-US")}`;
  };

  const addToWatchlist = async (symbol) => {
    try {
      const res = await API.post("/watchlist", {
        symbol,
      });

      alert(
        res.data.message ||
          `${symbol} added to watchlist`
      );
    } catch (error) {
      console.error("Watchlist error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to add stock"
      );
    }
  };

  if (!stocks || stocks.length === 0) {
    return <p>No stocks found.</p>;
  }

  return (
    <div className="table-wrapper">
      <table className="stock-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Company</th>
            <th>Price</th>
            <th>P/E</th>
            <th>Market Cap</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {stocks.map((stock) => (
            <tr key={stock.symbol}>
              <td className="symbol">
                {stock.symbol}
              </td>

              <td>
                {stock.company_name || "—"}
              </td>

              <td>
                {formatPrice(stock.current_price)}
              </td>

              <td>
                {formatRatio(stock.pe_ratio)}
              </td>

              <td>
                {formatMarketCap(stock.market_cap)}
              </td>

              <td>
                <button
                  onClick={() =>
                    addToWatchlist(stock.symbol)
                  }
                  className="watchlist-btn"
                >
                  ★ Watchlist
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}