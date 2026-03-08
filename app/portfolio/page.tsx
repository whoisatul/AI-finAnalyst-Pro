"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

interface Holding {
  id: number;
  ticker: string;
  quantity: number;
  price: number;
  value: number;
}

ChartJS.register(ArcElement, Tooltip, Legend);

const CHART_COLORS = [
  "#3b82f6",
  "#34d399",
  "#f59e0b",
  "#f87171",
  "#a855f7",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

export default function Portfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [newTicker, setNewTicker] = useState("");
  const [newQty, setNewQty] = useState("");
  const [loading, setLoading] = useState(true);

  const refreshPortfolio = async () => {
    try {
      const res = await fetch("/api/portfolio");
      const data = await res.json();
      setHoldings(data.holdings);
      setTotalValue(data.total_value);
    } catch (error) {
      console.error("Failed to load portfolio", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPortfolio();
  }, []);

  const handleAdd = async () => {
    if (!newTicker || !newQty) return;
    await fetch("/api/portfolio/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker: newTicker, quantity: newQty }),
    });
    setNewTicker("");
    setNewQty("");
    await refreshPortfolio();
  };

  const handleDelete = async (ticker: string) => {
    if (!confirm(`Remove ${ticker} from portfolio?`)) return;
    await fetch("/api/portfolio/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker }),
    });
    await refreshPortfolio();
  };

  const chartData = {
    labels: holdings.map((h) => h.ticker),
    datasets: [
      {
        data: holdings.map((h) => h.value),
        backgroundColor: CHART_COLORS,
        borderWidth: 0,
        hoverBorderWidth: 2,
        hoverBorderColor: "#fff",
      },
    ],
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 pb-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto pt-8 sm:pt-12 mb-8"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge">💼 Portfolio</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold gradient-text">
              My Portfolio
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1.5">
              Track and manage your stock holdings
            </p>
          </div>
          <a
            href="/api/portfolio/report"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download PDF
          </a>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-5"
        >
          {/* Add Position */}
          <div className="glass-card p-5 sm:p-6">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-[var(--text-secondary)]">
              <span className="text-lg">+</span> Add Position
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                placeholder="Ticker (e.g. AAPL)"
                className="premium-input flex-1"
              />
              <input
                type="number"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                placeholder="Quantity"
                className="premium-input w-full sm:w-28"
              />
              <button
                onClick={handleAdd}
                disabled={!newTicker || !newQty}
                className="btn-primary text-sm whitespace-nowrap"
              >
                Add Stock
              </button>
            </div>
          </div>

          {/* Holdings Table */}
          <div className="glass-card overflow-hidden">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Value</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.id}>
                    <td>
                      <span className="font-bold text-cyan-400">{h.ticker}</span>
                    </td>
                    <td className="tabular-nums text-[var(--text-secondary)]">
                      {h.quantity}
                    </td>
                    <td className="tabular-nums text-[var(--text-secondary)]">
                      ${h.price}
                    </td>
                    <td className="font-semibold text-emerald-400 tabular-nums">
                      ${h.value.toLocaleString()}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleDelete(h.ticker)}
                        className="text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/10 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {holdings.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="!py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl">📭</span>
                        <p className="text-[var(--text-muted)]">
                          No holdings yet. Add your first position above!
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Right Column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-5"
        >
          {/* Total Value Card */}
          <div className="relative overflow-hidden rounded-2xl p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-cyan-500/90" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23fff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%2220%22%20r%3D%221%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
            <div className="relative z-10">
              <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-1">
                Total Portfolio Value
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tabular-nums">
                ${totalValue.toLocaleString()}
              </h2>
              <p className="text-blue-200/60 text-xs mt-2">
                {holdings.length} position{holdings.length !== 1 ? "s" : ""} tracked
              </p>
            </div>
          </div>

          {/* Doughnut Chart */}
          <div className="glass-card p-5 sm:p-6 flex flex-col items-center">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-5 self-start uppercase tracking-wider">
              Asset Allocation
            </h3>
            <div className="w-52 h-52 sm:w-56 sm:h-56">
              {holdings.length > 0 ? (
                <Doughnut
                  data={chartData}
                  options={{
                    cutout: "72%",
                    plugins: { legend: { display: false } },
                    responsive: true,
                    maintainAspectRatio: true,
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-[var(--text-muted)] border-2 border-dashed border-white/10 rounded-full text-sm">
                  No Data
                </div>
              )}
            </div>
            {holdings.length > 0 && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-5 w-full">
                {holdings.map((h, i) => (
                  <div
                    key={h.ticker}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                    <span className="text-[var(--text-secondary)] truncate">
                      {h.ticker}
                    </span>
                    <span className="ml-auto text-[var(--text-muted)] tabular-nums">
                      {totalValue > 0
                        ? Math.round((h.value / totalValue) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}