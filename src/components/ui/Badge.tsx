import { type HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-[#222] text-[#888]",
        red: "bg-[#dc2626]/10 text-[#ef4444] border border-[#dc2626]/25",
        green: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
        yellow: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25",
        blue: "bg-blue-500/10 text-blue-400 border border-blue-500/25",
        live: "bg-[#dc2626]/10 text-[#ef4444] border border-[#dc2626]/25 animate-pulse",
        white: "bg-white/10 text-white border border-white/15",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, className }))}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
