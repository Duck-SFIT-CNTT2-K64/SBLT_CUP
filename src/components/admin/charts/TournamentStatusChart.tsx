"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface DataPoint {
  status: string;
  count: number;
}

interface TournamentStatusChartProps {
  data: DataPoint[];
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "#22c55e",
  IN_PROGRESS: "#dc2626",
  REGISTRATION_OPEN: "#3b82f6",
  REGISTRATION_CLOSED: "#eab308",
  UPCOMING: "#8b5cf6",
  CANCELLED: "#666",
};

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: "Đã kết thúc",
  IN_PROGRESS: "Đang diễn ra",
  REGISTRATION_OPEN: "Mở đăng ký",
  REGISTRATION_CLOSED: "Đóng đăng ký",
  UPCOMING: "Sắp diễn ra",
  CANCELLED: "Đã hủy",
};

export function TournamentStatusChart({ data }: TournamentStatusChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: STATUS_LABELS[d.status] || d.status,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="count"
          nameKey="label"
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={STATUS_COLORS[entry.status] || "#666"}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#111",
            border: "1px solid #333",
            borderRadius: "8px",
            color: "#f5f5f5",
          }}
          formatter={(value) => [value, "Giải đấu"]}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px", color: "#888" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
