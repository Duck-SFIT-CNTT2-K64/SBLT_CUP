"use client";

import { Card } from "@/components/ui/Card";

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, description, children, className }: ChartCardProps) {
  return (
    <Card hover={false} className={`p-6 ${className || ""}`}>
      <h3 className="text-base font-semibold text-[#f5f5f5] mb-1">{title}</h3>
      {description && <p className="text-xs text-[#888] mb-4">{description}</p>}
      <div className="w-full h-64">
        {children}
      </div>
    </Card>
  );
}
