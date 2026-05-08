"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, CheckCircle, Info, X, XCircle } from "lucide-react";

type AlertVariant = "error" | "success" | "warning" | "info";

interface AlertProps {
  variant: AlertVariant;
  message: string;
  dismissible?: boolean;
  autoDismiss?: number;
  onDismiss?: () => void;
  className?: string;
}

const VARIANT_CONFIG: Record<
  AlertVariant,
  {
    icon: typeof AlertTriangle;
    borderColor: string;
    bgColor: string;
    iconColor: string;
    textColor: string;
  }
> = {
  error: {
    icon: XCircle,
    borderColor: "border-l-[#dc2626]",
    bgColor: "bg-[#dc2626]/5",
    iconColor: "text-[#dc2626]",
    textColor: "text-[#f5f5f5]",
  },
  success: {
    icon: CheckCircle,
    borderColor: "border-l-emerald-500",
    bgColor: "bg-emerald-500/5",
    iconColor: "text-emerald-400",
    textColor: "text-[#f5f5f5]",
  },
  warning: {
    icon: AlertTriangle,
    borderColor: "border-l-amber-500",
    bgColor: "bg-amber-500/5",
    iconColor: "text-amber-400",
    textColor: "text-[#f5f5f5]",
  },
  info: {
    icon: Info,
    borderColor: "border-l-sky-500",
    bgColor: "bg-sky-500/5",
    iconColor: "text-sky-400",
    textColor: "text-[#f5f5f5]",
  },
};

export function Alert({
  variant,
  message,
  dismissible = true,
  autoDismiss = 0,
  onDismiss,
  className = "",
}: AlertProps) {
  const [visible, setVisible] = useState(true);
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  const handleDismiss = useCallback(() => {
    setVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  useEffect(() => {
    if (autoDismiss > 0) {
      const timer = setTimeout(handleDismiss, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, handleDismiss]);

  if (!visible || !message) return null;

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-lg text-sm
        border border-[#222] border-l-[3px] ${config.borderColor}
        ${config.bgColor} ${config.textColor}
        animate-fade-in
        ${className}
      `}
      role="alert"
    >
      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.iconColor}`} />
      <span className="flex-1 leading-relaxed">{message}</span>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="shrink-0 p-0.5 rounded text-[#888] hover:text-[#f5f5f5] hover:bg-[#222] transition-colors"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
