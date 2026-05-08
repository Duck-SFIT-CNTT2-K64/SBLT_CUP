import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
  center?: boolean;
}

export function SectionHeading({ title, subtitle, className, center = true }: SectionHeadingProps) {
  return (
    <div className={cn(center && "text-center", "mb-12", className)}>
      <h2 className="sblt-heading text-3xl md:text-4xl text-[#f5f5f5] tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-[#888] text-sm md:text-base">{subtitle}</p>
      )}
      <div className={cn("w-16 h-0.5 bg-[#dc2626] mt-5", center && "mx-auto")} />
    </div>
  );
}
