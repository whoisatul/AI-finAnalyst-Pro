"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import StockChart from "@/components/stockChart";

interface StockData {
  company: string;
  ticker: string;
  price: number;
  change_pct: number;
  pe_ratio: number | string;
  beta: number | string;
  insight: string;
  history_json: { Date: string; Close: number }[];
}

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StockData | null>(null);

  const analyzeStock = async () => {
    if (!ticker) return;
    setLoading(true);
    setData(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Error:", error);
      alert("Analysis failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 sm:px-6 pb-16">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="max-w-3xl w-full text-center pt-12 sm:pt-20 pb-12 space-y-6"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 badge"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          AI-Powered Analysis
        </motion.div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
          <span className="gradient-text">Financial Intelligence,</span>
          <br />
          <span className="gradient-text-accent">Simplified.</span>
        </h1>

        <p className="text-[var(--text-secondary)] text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Enter a stock ticker to get real-time data, AI-driven analysis, and
          institutional-grade insights in seconds.
        </p>

        {/* Search Bar — Clean, minimal style */}
        <div className="max-w-2xl mx-auto pt-2">
          <div className="flex items-center bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] focus-within:border-[var(--accent-blue)]/40 transition-colors">
            <div className="pl-4 text-[var(--text-muted)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && analyzeStock()}
              placeholder="Enter ticker symbol (AAPL, TSLA, MSFT...)"
              className="flex-1 bg-transparent px-4 py-4 text-base focus:outline-none placeholder:text-[var(--text-muted)]"
            />
            <div className="pr-1.5">
              <button
                onClick={analyzeStock}
                disabled={loading || !ticker}
                className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Analyze
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Loading Skeleton */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-3 gap-5"
        >
          <div className="lg:col-span-2 space-y-5">
            <div className="glass-card p-6 space-y-4">
              <div className="skeleton h-8 w-48" />
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-[280px] w-full mt-4" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-5">
                <div className="skeleton h-3 w-16 mb-2" />
                <div className="skeleton h-7 w-20" />
              </div>
              <div className="glass-card p-5">
                <div className="skeleton h-3 w-16 mb-2" />
                <div className="skeleton h-7 w-20" />
              </div>
            </div>
          </div>
          <div className="glass-card p-6 space-y-4">
            <div className="skeleton h-6 w-40" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-4 w-2/3" />
          </div>
        </motion.div>
      )}

      {/* Results Section */}
      {data && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-3 gap-5 items-start"
        >
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Chart Card */}
            <div className="glass-card glow-border p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-5">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold gradient-text">
                    {data.company}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge">{data.ticker}</span>
                    <span className="text-xs text-[var(--text-muted)]">30-Day Chart</span>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-2xl sm:text-3xl font-bold tabular-nums">
                    ${data.price}
                  </p>
                  <p className={`text-sm font-semibold flex items-center gap-1 ${data.change_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    <span>{data.change_pct >= 0 ? "▲" : "▼"}</span>
                    {data.change_pct > 0 ? "+" : ""}{data.change_pct}% Today
                  </p>
                </div>
              </div>
              <div className="h-[280px] sm:h-[320px] w-full">
                <StockChart history={data.history_json} />
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-5">
                <p className="text-[var(--text-muted)] text-[0.65rem] uppercase tracking-widest font-semibold mb-1.5">
                  P/E Ratio
                </p>
                <p className="text-2xl font-bold tabular-nums">{data.pe_ratio}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Price to Earnings</p>
              </div>
              <div className="glass-card p-5">
                <p className="text-[var(--text-muted)] text-[0.65rem] uppercase tracking-widest font-semibold mb-1.5">
                  Beta
                </p>
                <p className="text-2xl font-bold tabular-nums text-cyan-400">{data.beta}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Volatility Index</p>
              </div>
            </div>
          </div>

          {/* Right Column: AI Analysis — height matches chart + stat cards */}
          <div className="glass-card glow-border p-5 sm:p-6 flex flex-col h-fit lg:max-h-[calc(100vh-8rem)] lg:self-start">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/20">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold">AI Analyst Insight</h3>
                <p className="text-xs text-[var(--text-muted)]">Powered by LangGraph</p>
              </div>
            </div>

            {/* Rendered Markdown */}
            <div className="flex-1 overflow-y-auto pr-1 -mr-1">
              <div className="ai-insight-content text-sm text-[var(--text-secondary)] leading-relaxed">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h2 className="text-lg font-bold text-white mt-4 mb-2">{children}</h2>,
                    h2: ({ children }) => <h3 className="text-base font-bold text-white mt-4 mb-2">{children}</h3>,
                    h3: ({ children }) => <h4 className="text-sm font-semibold text-white mt-3 mb-1.5">{children}</h4>,
                    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                    em: ({ children }) => <em className="text-cyan-300/80">{children}</em>,
                    p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1.5 ml-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1.5 ml-1">{children}</ol>,
                    li: ({ children }) => <li className="text-[var(--text-secondary)]">{children}</li>,
                    hr: () => <hr className="border-[var(--border-subtle)] my-4" />,
                  }}
                >
                  {data.insight}
                </ReactMarkdown>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
              <p className="text-[0.65rem] text-center text-[var(--text-muted)] uppercase tracking-wider">
                AI-Generated • Not Financial Advice
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}