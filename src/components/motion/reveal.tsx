/**
 * Reveal markers. Every outermost content block on the public site animates
 * the same way — from blurred, slightly smaller and transparent to sharp, full
 * size and opaque — via the site-wide CSS entrance and <RevealController />.
 * These components only mark a block as one unit (so its children don't
 * animate separately) and order staggered groups; they render plain elements.
 */

type Tag = "div" | "section" | "li" | "ul" | "article" | "header" | "p" | "span";

export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  /** Seconds to wait before the first entrance. */
  delay?: number;
  /** Accepted for compatibility; reveals no longer travel vertically. */
  y?: number;
  as?: Tag;
  id?: string;
}) {
  const Component = as;
  return (
    <Component
      id={id}
      data-reveal=""
      className={className}
      style={delay ? ({ "--reveal-delay": `${delay}s` } as React.CSSProperties) : undefined}
    >
      {children}
    </Component>
  );
}

/** A container whose <RevealItem> children enter one after another. */
export function RevealGroup({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: Tag;
}) {
  const Component = as;
  return (
    <Component data-reveal-group="" className={className}>
      {children}
    </Component>
  );
}

export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: Tag;
}) {
  const Component = as;
  return (
    <Component data-reveal="" className={className}>
      {children}
    </Component>
  );
}
