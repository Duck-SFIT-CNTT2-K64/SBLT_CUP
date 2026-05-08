"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DataPoint {
  date: string;
  count: number;
}

interface PlayerActivityChartProps {
  data: DataPoint[];
}

export function PlayerActivityChart({ data }: PlayerActivityChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={formattedData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
        <XAxis dataKey="label" stroke="#555" tick={{ fontSize: 11 }} />
        <YAxis stroke="#555" tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#111",
            border: "1px solid #333",
            borderRadius: "8px",
            color: "#f5f5f5",
          }}
          labelStyle={{ color: "#888" }}
          formatter={(value) => [value, "Hoạt động"]}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: "#3b82f6", r: 3 }}
          activeDot={{ r: 5, fill: "#60a5fa" }}
          name="Hoạt động"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
