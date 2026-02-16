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

// Register Chart.js modules
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

export default function StockChart({ history }: { history: any[] }) {
  if (!history || history.length === 0) return null;

  // Process data for the chart
  const labels = history.map((item) => new Date(item.Date).toLocaleDateString());
  const prices = history.map((item) => item.Close);
  
  // Determine color based on trend (Green if up, Red if down)
  const isUp = prices[prices.length - 1] >= prices[0];
  const chartColor = isUp ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"; // Tailwind green-500 / red-500
  const areaColor = isUp ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)";

  const data = {
    labels,
    datasets: [
      {
        fill: true,
        label: "Stock Price",
        data: prices,
        borderColor: chartColor,
        backgroundColor: areaColor,
        tension: 0.4, // Smooth curves
        pointRadius: 0, // Hide points for a cleaner look
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(0,0,0,0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
      },
    },
    scales: {
      x: { display: false }, // Hide X axis dates for minimalism
      y: {
        display: true,
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "rgba(255, 255, 255, 0.5)" },
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