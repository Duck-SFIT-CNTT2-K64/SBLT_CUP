"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface DataPoint {
  placement: number;
  count: number;
}

interface MatchDistributionChartProps {
  data: DataPoint[];
}

const PLACEMENT_COLORS = [
  "#ffd700", // 1st - gold
  "#c0c0c0", // 2nd - silver
  "#cd7f32", // 3rd - bronze
  "#dc2626", // 4th - red
  "#888",    // 5th
  "#666",    // 6th
  "#555",    // 7th
  "#444",    // 8th
];

export function MatchDistributionChart({ data }: MatchDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
        <XAxis
          dataKey="placement"
          stroke="#555"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `#${v}`}
        />
        <YAxis stroke="#555" tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#111",
            border: "1px solid #333",
            borderRadius: "8px",
            color: "#f5f5f5",
          }}
          labelFormatter={(v) => `Top ${v}`}
          formatter={(value) => [value, "Số lần"]}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Số lần">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={PLACEMENT_COLORS[index] || "#444"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
