import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "inverse" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-brand-fg hover:bg-fg-muted",
  secondary: "bg-bg-muted text-fg hover:bg-line-strong",
  ghost: "text-fg hover:bg-bg-muted",
  inverse: "bg-white text-[#1d1d1f] hover:bg-white/85",
  danger: "bg-danger text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[0.875rem] gap-1.5",
  md: "h-10 px-5 text-[0.9375rem] gap-2",
  lg: "h-12 px-7 text-[1.0625rem] gap-2",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "press inline-flex shrink-0 select-none items-center justify-center rounded-full font-medium whitespace-nowrap",
    "transition-[background-color,color,opacity,transform] duration-200 disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:size-4",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  href,
  variant,
  size,
  className,
  external,
  prefetch,
  ...props
}: Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  variant?: Variant;
  size?: Size;
  external?: boolean;
  prefetch?: boolean;
}) {
  if (external) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClass(variant, size, className)} {...props} />;
  }
  return <Link href={href} prefetch={prefetch} className={buttonClass(variant, size, className)} {...props} />;
}

/** Apple-style text link with a trailing chevron: “Learn more ›”. */
export function ArrowLink({
  href,
  children,
  className,
  external,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}) {
  const cls = cn(
    "group inline-flex items-center gap-0.5 font-medium text-link decoration-1 underline-offset-4 hover:underline",
    className,
  );
  const content = (
    <>
      {children}
      <ChevronRight
        aria-hidden
        className="size-[1em] translate-y-px transition-transform duration-300 group-hover:translate-x-0.5"
      />
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {content}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {content}
    </Link>
  );
}
