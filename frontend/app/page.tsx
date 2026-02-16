"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import StockChart from "@/components/stockChart"; // Import the new chart

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const analyzeStock = async () => {
    if (!ticker) return;
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Error:", error);
      alert("Connection failed. Is the Backend (Flask) running on port 5001?");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center p-6 selection:bg-cyan-500/30">
      
      {/* Main Search Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full text-center space-y-8 mb-12"
      >
        <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 tracking-tight">
          Financial Intelligence, <br/> Simplified.
        </h1>
        
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex bg-[#1e293b] rounded-2xl p-2 ring-1 ring-white/10 shadow-2xl">
            <input 
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && analyzeStock()}
              placeholder="Search Ticker (e.g. AAPL, TSLA)..."
              className="flex-1 bg-transparent px-6 py-4 text-lg focus:outline-none placeholder:text-gray-500"
            />
            <button 
              onClick={analyzeStock}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Analyze"
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Results Section */}
      {data && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Left Column: Chart & Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1e293b]/50 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold">{data.company}</h2>
                  <p className="text-gray-400 font-mono text-sm">{data.ticker}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">${data.price}</p>
                  <p className={`font-medium ${data.change_pct >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {data.change_pct > 0 ? "+" : ""}{data.change_pct}% Today
                  </p>
                </div>
              </div>
              
              {/* The New Chart Component */}
              <div className="h-[300px] w-full">
                <StockChart history={data.history_json} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-[#1e293b]/50 border border-white/10 p-6 rounded-3xl">
                  <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">P/E Ratio</p>
                  <p className="text-2xl font-bold text-white">{data.pe_ratio}</p>
               </div>
               <div className="bg-[#1e293b]/50 border border-white/10 p-6 rounded-3xl">
                  <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Beta (Risk)</p>
                  <p className="text-2xl font-bold text-cyan-400">{data.beta}</p>
               </div>
            </div>
          </div>

          {/* Right Column: AI Analysis */}
          <div className="bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-xl flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h3 className="text-xl font-bold">AI Analyst Insight</h3>
            </div>
            
            <div className="prose prose-invert prose-sm max-w-none flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="text-gray-300 whitespace-pre-line leading-relaxed">
                {data.insight}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs text-center text-gray-500">
                Generated by LangGraph & Mistral-7B. Not financial advice.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}