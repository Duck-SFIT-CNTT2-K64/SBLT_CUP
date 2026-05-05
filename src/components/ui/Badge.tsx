import { type HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold",
  {
    variants: {
      variant: {
        default: "bg-sblt-border text-sblt-muted",
        red: "bg-sblt-red/15 text-red-400 border border-red-800/50",
        green: "bg-green-500/15 text-green-400 border border-green-800/50",
        yellow: "bg-yellow-500/15 text-yellow-400 border border-yellow-800/50",
        blue: "bg-blue-500/15 text-blue-400 border border-blue-800/50",
        live: "bg-sblt-red/15 text-red-400 border border-red-800/50 animate-pulse",
        white: "bg-white/10 text-white border border-white/20",
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
