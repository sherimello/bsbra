import { cn } from "@/lib/utils";

/** Scrollable, hairline-bordered table container with Apple-style density. */
export function TableShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-[var(--radius-card)] bg-surface hairline", className)}>
      <table className="w-full min-w-[640px] border-collapse text-left text-[0.875rem]">{children}</table>
    </div>
  );
}

export function Th({ className, numeric, ...props }: React.ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        "sticky top-0 border-b border-line bg-bg-subtle px-4 py-3 text-[0.75rem] font-semibold whitespace-nowrap text-fg-subtle",
        numeric && "text-right",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, numeric, ...props }: React.TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td
      className={cn("border-b border-line px-4 py-3 align-top text-fg-muted", numeric && "text-right tabular whitespace-nowrap", className)}
      {...props}
    />
  );
}

export function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors last:[&>td]:border-0 hover:bg-bg-subtle/60", className)} {...props} />;
}
