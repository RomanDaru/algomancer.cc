"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";
import { Pie } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface LazyPieChartProps {
  data: ChartData<"pie", number[], string>;
  options: ChartOptions<"pie">;
}

export default function LazyPieChart({ data, options }: LazyPieChartProps) {
  return <Pie data={data} options={options} />;
}
