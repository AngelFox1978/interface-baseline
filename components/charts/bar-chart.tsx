"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const INDIGO = "#4f46e5";
const INDIGO_LIGHT = "#a5b4fc";

type Props = {
  labels: string[];
  /** Une ou plusieurs séries. Plusieurs séries => barres empilées. */
  series: { data: number[]; color?: string }[];
  stacked?: boolean;
  max?: number;
  height?: number;
};

export function BarChart({
  labels,
  series,
  stacked = false,
  max,
  height = 220,
}: Props) {
  const data: ChartData<"bar"> = {
    labels,
    datasets: series.map((s, i) => ({
      data: s.data,
      backgroundColor: s.color ?? (i === 0 ? INDIGO : INDIGO_LIGHT),
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 22,
    })),
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      x: {
        stacked,
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#94a3b8", font: { size: 11 } },
      },
      y: {
        stacked,
        max,
        beginAtZero: true,
        grid: { color: "#eef0f6" },
        border: { display: false },
        ticks: { color: "#94a3b8", font: { size: 11 } },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  );
}
