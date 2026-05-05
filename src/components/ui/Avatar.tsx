import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "host" | "commentator";
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

const variantClasses = {
  default: "bg-gradient-to-br from-sblt-border to-sblt-dark text-sblt-muted",
  host: "bg-gradient-to-br from-sblt-red to-sblt-red-dark text-white",
  commentator: "bg-gradient-to-br from-sblt-red/60 to-sblt-red-dark/60 text-white",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, name, size = "md", variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-full flex items-center justify-center font-bold shrink-0 select-none",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        title={name}
        {...props}
      >
        {getInitials(name)}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export { Avatar };
export type { AvatarProps };
