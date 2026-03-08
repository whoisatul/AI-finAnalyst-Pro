"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

/* ── SVG Icon Components ── */
const DashboardIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
  </svg>
);

const PortfolioIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const HistoryIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", path: "/", icon: DashboardIcon },
    { name: "Portfolio", path: "/portfolio", icon: PortfolioIcon },
    { name: "History", path: "/history", icon: HistoryIcon },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Gradient accent line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      <div className="backdrop-blur-xl bg-[var(--bg-primary)]/80 border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-xl group-hover:rotate-12 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-cyan-500/25" />
              <div className="absolute inset-[2px] bg-[var(--bg-primary)] rounded-[10px] flex items-center justify-center">
                <span className="text-xs font-bold gradient-text-accent">F</span>
              </div>
            </div>
            <span className="text-lg font-bold tracking-tight gradient-text hidden sm:block">
              FinAnalyst Pro
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-1 bg-white/[0.03] p-1 rounded-full border border-[var(--border-subtle)]">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`relative px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${isActive
                      ? "text-white"
                      : "text-[var(--text-secondary)] hover:text-white"
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-white/[0.08] rounded-full border border-[var(--border-subtle)]"
                      transition={{
                        type: "spring",
                        bounce: 0.15,
                        duration: 0.5,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Status + Mobile Toggle */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-emerald-400/80">Live</span>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Toggle menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className={`w-full h-0.5 bg-white/60 rounded transition-all ${mobileOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
                <span className={`w-full h-0.5 bg-white/60 rounded transition-all ${mobileOpen ? "opacity-0" : ""}`} />
                <span className={`w-full h-0.5 bg-white/60 rounded transition-all ${mobileOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-[var(--border-subtle)]"
            >
              <div className="px-4 py-3 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive
                          ? "bg-white/[0.08] text-white"
                          : "text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-white"
                        }`}
                    >
                      <Icon />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}