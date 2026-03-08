"use client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface HistoryPoint {
  Date: string;
  Close: number;
}

export default function StockChart({ history }: { history: HistoryPoint[] }) {
  if (!history || history.length === 0) return null;

  const labels = history.map((item) =>
    new Date(item.Date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  );
  const prices = history.map((item) => item.Close);

  const isUp = prices[prices.length - 1] >= prices[0];
  const lineColor = isUp ? "#34d399" : "#f87171";

  const data = {
    labels,
    datasets: [
      {
        fill: true,
        label: "Price",
        data: prices,
        borderColor: lineColor,
        borderWidth: 2,
        backgroundColor: (context: { chart: ChartJS }) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return "transparent";
          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom
          );
          gradient.addColorStop(0, isUp ? "rgba(52, 211, 153, 0.2)" : "rgba(248, 113, 113, 0.2)");
          gradient.addColorStop(1, "transparent");
          return gradient;
        },
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: lineColor,
        pointHoverBorderColor: "#fff",
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(6, 9, 24, 0.9)",
        titleColor: "#f1f5f9",
        bodyColor: "#94a3b8",
        borderColor: "rgba(255, 255, 255, 0.08)",
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        displayColors: false,
        titleFont: { size: 13, weight: 600 as const },
        bodyFont: { size: 12 },
        callbacks: {
          label: (ctx: { parsed: { y: number | null } }) =>
            `$${(ctx.parsed.y ?? 0).toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: { display: false },
        ticks: {
          color: "rgba(255, 255, 255, 0.25)",
          font: { size: 10 },
          maxRotation: 0,
          maxTicksLimit: 6,
        },
        border: { display: false },
      },
      y: {
        display: true,
        position: "right" as const,
        grid: {
          color: "rgba(255, 255, 255, 0.03)",
          drawTicks: false,
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.3)",
          font: { size: 10 },
          padding: 8,
          callback: (value: string | number) => `$${value}`,
        },
        border: { display: false },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  return <Line data={data} options={options} />;
}