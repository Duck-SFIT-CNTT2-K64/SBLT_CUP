import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-[#111] border border-[#222] rounded-lg",
          hover && "hover:border-[#dc2626]/60 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(220,38,38,0.15)] transition-all duration-300",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("p-6 pb-4", className)} {...props} />
    );
  }
);
CardHeader.displayName = "CardHeader";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("px-6 pb-6", className)} {...props} />
    );
  }
);
CardContent.displayName = "CardContent";

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h3 ref={ref} className={cn("text-lg font-bold text-[#f5f5f5]", className)} {...props} />
    );
  }
);
CardTitle.displayName = "CardTitle";

export { Card, CardHeader, CardContent, CardTitle };
