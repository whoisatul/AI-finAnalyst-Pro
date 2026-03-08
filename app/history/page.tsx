"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface HistoryItem {
  id: number;
  ticker: string;
  analysis: string;
  date: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => {
        setHistory(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen px-4 sm:px-6 pb-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto pt-8 sm:pt-12 mb-10"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge">📜 History</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">
              <span className="gradient-text-accent">Analysis Timeline</span>
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1.5">
              Your last 20 AI-generated research reports
            </p>
          </div>
          <div className="text-xs text-[var(--text-muted)] tabular-nums">
            {history.length} report{history.length !== 1 ? "s" : ""}
          </div>
        </div>
      </motion.div>

      {/* Timeline */}
      <div className="max-w-3xl mx-auto relative">
        {/* Vertical Line */}
        <div className="absolute left-[15px] sm:left-[19px] top-2 bottom-0 w-px bg-gradient-to-b from-purple-500/40 via-blue-500/20 to-transparent" />

        <div className="space-y-6">
          {history.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.5) }}
              className="relative pl-10 sm:pl-14"
            >
              {/* Timeline Dot */}
              <div className="absolute left-0 sm:left-1 top-5 w-[30px] h-[30px] sm:w-[38px] sm:h-[38px] rounded-full border-2 border-purple-500/40 bg-[var(--bg-primary)] flex items-center justify-center z-10">
                <div className="w-2 h-2 bg-purple-400 rounded-full" />
              </div>

              {/* Card */}
              <div
                className="glass-card p-5 sm:p-6 cursor-pointer group"
                onClick={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl sm:text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">
                      {item.ticker}
                    </span>
                    <span className="badge">AI Report</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] tabular-nums">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {item.date}
                  </div>
                </div>

                <div
                  className={`text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line transition-all duration-300 ${expandedId === item.id ? "" : "line-clamp-3"
                    }`}
                >
                  {item.analysis}
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex justify-end">
                  <span className="text-xs text-purple-400/70 group-hover:text-purple-400 transition-colors flex items-center gap-1">
                    {expandedId === item.id ? "Collapse" : "Read More"}
                    <svg
                      className={`w-3 h-3 transition-transform duration-200 ${expandedId === item.id ? "rotate-180" : ""
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {!loading && history.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-[var(--text-muted)] text-lg">
              No analysis history yet
            </p>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              Go to the Dashboard and analyze your first stock!
            </p>
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="pl-14">
                <div className="glass-card p-6 space-y-3">
                  <div className="skeleton h-7 w-24" />
                  <div className="skeleton h-4 w-full" />
                  <div className="skeleton h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}