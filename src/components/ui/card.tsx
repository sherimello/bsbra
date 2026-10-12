import { cn } from "@/lib/utils";

export function Card({
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] bg-surface hairline",
        interactive &&
          "transition-[transform,box-shadow] duration-500 ease-[var(--ease-out-quint)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]",
        className,
      )}
      {...props}
    />
  );
}
