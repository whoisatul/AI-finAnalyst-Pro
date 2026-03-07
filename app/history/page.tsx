"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface HistoryItem {
  id: number;
  ticker: string;
  analysis: string;
  date: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => {
        setHistory(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Analysis Timeline
          </h1>
          <p className="text-gray-400 mt-2">Past 20 AI research reports</p>
        </div>
        <Link href="/" className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Timeline Container */}
      <div className="max-w-3xl mx-auto space-y-8 relative">
        {/* Vertical Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/50 to-transparent"></div>

        {history.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative pl-12"
          >
            {/* Timeline Dot */}
            <div className="absolute left-0 top-6 w-8 h-8 bg-slate-900 border-2 border-purple-500 rounded-full flex items-center justify-center z-10">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            </div>

            {/* Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">
                    {item.ticker}
                  </span>
                  <span className="ml-3 text-xs text-gray-500 font-mono border border-white/10 px-2 py-1 rounded">
                    AI REPORT
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">{item.date.split(' ')[0]}</p>
                  <p className="text-xs text-gray-600">{item.date.split(' ')[1]}</p>
                </div>
              </div>

              <div className="prose prose-invert prose-sm max-w-none">
                <div className="line-clamp-3 text-gray-300 leading-relaxed">
                  {item.analysis}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                <button className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1">
                  Full Report Archived <span className="text-xs">🔒</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {!loading && history.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            No history found. Go analyze some stocks!
          </div>
        )}
      </div>
    </div>
  );
}