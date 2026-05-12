"use client";

import { type HTMLAttributes, forwardRef, useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "host" | "commentator";
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

const variantClasses = {
  default: "bg-gradient-to-br from-[#222] to-[#111] text-[#888] border-2 border-[#222]",
  host: "bg-gradient-to-br from-[#dc2626] to-[#991b1b] text-white border-2 border-[#dc2626]/30",
  commentator: "bg-gradient-to-br from-[#dc2626]/60 to-[#991b1b]/60 text-white border-2 border-[#dc2626]/20",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const sizeSizes = {
  sm: "32px",
  md: "40px",
  lg: "48px",
  xl: "64px",
};

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, name, src, size = "md", variant = "default", ...props }, ref) => {
    const [imgError, setImgError] = useState(false);
    const showImage = src && !imgError;

    useEffect(() => {
      setImgError(false);
    }, [src]);

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-full flex items-center justify-center font-bold shrink-0 select-none overflow-hidden",
          sizeClasses[size],
          !showImage && variantClasses[variant],
          className
        )}
        title={name}
        {...props}
      >
        {showImage ? (
          <Image
            src={src}
            alt={name}
            fill
            sizes={sizeSizes[size]}
            className="object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          getInitials(name)
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export { Avatar };
export type { AvatarProps };
