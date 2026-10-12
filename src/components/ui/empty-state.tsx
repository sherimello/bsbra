import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-[var(--radius-card)] bg-bg-subtle px-6 py-16 text-center", className)}>
      {icon && <div className="mb-4 text-fg-faint [&_svg]:size-8">{icon}</div>}
      <p className="text-[1.0625rem] font-semibold text-fg">{title}</p>
      {body && <p className="mt-1.5 max-w-md text-[0.9375rem] text-fg-subtle">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
