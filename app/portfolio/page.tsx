"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import Link from "next/link";

interface Holding {
  id: number;
  ticker: string;
  quantity: number;
  price: number;
  value: number;
}

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export default function Portfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [newTicker, setNewTicker] = useState("");
  const [newQty, setNewQty] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadPortfolio = async () => {
      try {
        const res = await fetch("/api/portfolio");
        const data = await res.json();
        if (mounted) {
          setHoldings(data.holdings);
          setTotalValue(data.total_value);
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          console.error("Failed to load portfolio", error);
          setLoading(false);
        }
      }
    };

    loadPortfolio();
    return () => { mounted = false; };
  }, []);

  // Add Stock
  const handleAdd = async () => {
    if (!newTicker || !newQty) return;
    await fetch("/api/portfolio/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker: newTicker, quantity: newQty }),
    });
    setNewTicker("");
    setNewQty("");
    window.location.reload(); // Simple refresh to get new data
  };

  // Delete Stock
  const handleDelete = async (ticker: string) => {
    if (!confirm(`Remove ${ticker}?`)) return;
    await fetch("/api/portfolio/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker }),
    });
    window.location.reload();
  };

  // Chart Data Configuration
  const chartData = {
    labels: holdings.map((h) => h.ticker),
    datasets: [
      {
        data: holdings.map((h) => h.value),
        backgroundColor: [
          "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      {/* Navigation (Simple) */}
      <div className="max-w-6xl mx-auto mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Portfolio</h1>
        <Link href="/" className="text-blue-400 hover:text-blue-300">← Back to Dashboard</Link>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Add Stock & Table */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Add Stock Card */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
            <h3 className="text-xl font-bold mb-4">Add Position</h3>
            <div className="flex gap-4">
              <input
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                placeholder="Ticker (e.g. MSFT)"
                className="flex-1 bg-black/20 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                placeholder="Qty"
                className="w-24 bg-black/20 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAdd}
                className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-bold transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Holdings Table */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
            <table className="w-full text-left">
              <thead className="bg-black/20 text-gray-400 uppercase text-sm">
                <tr>
                  <th className="p-4">Ticker</th>
                  <th className="p-4">Qty</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Value</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {holdings.map((h) => (
                  <tr key={h.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-blue-400">{h.ticker}</td>
                    <td className="p-4">{h.quantity}</td>
                    <td className="p-4">${h.price}</td>
                    <td className="p-4 font-bold text-green-400">${h.value.toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(h.ticker)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10 px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {holdings.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No stocks yet. Add one above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Right: Charts & Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-6 rounded-2xl shadow-lg">
            <p className="text-blue-100 text-sm font-medium mb-1">Total Portfolio Value</p>
            <h2 className="text-4xl font-bold">${totalValue.toLocaleString()}</h2>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md flex flex-col items-center">
            <h3 className="text-xl font-bold mb-6 self-start">Asset Allocation</h3>
            <div className="w-64 h-64">
              {holdings.length > 0 ? (
                <Doughnut data={chartData} options={{ cutout: '70%', plugins: { legend: { display: false } } }} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-700 rounded-full">
                  No Data
                </div>
              )}
            </div>
            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 mt-6 w-full">
              {holdings.map((h, i) => (
                <div key={h.ticker} className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: chartData.datasets[0].backgroundColor[i % 6] }}></span>
                  <span className="text-gray-300">{h.ticker}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}