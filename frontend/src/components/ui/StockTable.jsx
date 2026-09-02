import API from "../../services/api";

export default function StockTable({ stocks }) {
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

              <td>{stock.company_name}</td>

              <td>
                {stock.current_price ?? "—"}
              </td>

              <td>
                {stock.pe_ratio ?? "—"}
              </td>

              <td>
                {stock.market_cap ?? "—"}
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