import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div className="w-full overflow-x-auto">
        <table ref={ref} className={cn("w-full border-collapse", className)} {...props} />
      </div>
    );
  }
);
Table.displayName = "Table";

const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => {
    return (
      <thead
        ref={ref}
        className={cn("bg-[#111] border-b-2 border-[#dc2626]", className)}
        {...props}
      />
    );
  }
);
TableHeader.displayName = "TableHeader";

const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => {
    return <tbody ref={ref} className={cn("", className)} {...props} />;
  }
);
TableBody.displayName = "TableBody";

const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(
          "border-b border-[#222] hover:bg-[#dc2626]/[0.04] transition-colors",
          className
        )}
        {...props}
      />
    );
  }
);
TableRow.displayName = "TableRow";

const TableHead = forwardRef<HTMLTableCellElement, HTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn(
          "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#888]",
          className
        )}
        {...props}
      />
    );
  }
);
TableHead.displayName = "TableHead";

const TableCell = forwardRef<HTMLTableCellElement, HTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={cn("px-4 py-3 text-sm text-[#f5f5f5]", className)}
        {...props}
      />
    );
  }
);
TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
