"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DataPoint {
  date: string;
  count: number;
}

interface RegistrationsChartProps {
  data: DataPoint[];
}

export function RegistrationsChart({ data }: RegistrationsChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={formattedData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
          </linearGradient>
        </defs>
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
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#dc2626"
          fill="url(#colorRegistrations)"
          strokeWidth={2}
          name="Đăng ký"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
