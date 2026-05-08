import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-[#dc2626] hover:bg-[#b91c1c] text-white shadow-lg shadow-[#dc2626]/20 hover:shadow-[#dc2626]/40 hover:scale-[1.02]",
        outline: "border border-[#444] text-[#f5f5f5] hover:border-[#dc2626] hover:bg-[#dc2626]/10",
        ghost: "text-[#888] hover:text-white hover:bg-white/5",
        danger: "bg-red-950/50 border border-red-900 text-red-400 hover:bg-red-950/80",
      },
      size: {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-2.5 text-sm",
        lg: "px-8 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
