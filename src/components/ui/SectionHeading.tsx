import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
  center?: boolean;
}

export function SectionHeading({ title, subtitle, className, center = true }: SectionHeadingProps) {
  return (
    <div className={cn(center && "text-center", "mb-10", className)}>
      <h2 className="sblt-heading text-3xl md:text-4xl text-white">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-sblt-muted text-sm md:text-base">{subtitle}</p>
      )}
      <div className={cn("sblt-divider w-20 mt-4", center && "mx-auto")} />
    </div>
  );
}
