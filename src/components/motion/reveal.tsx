"use client";

import { m, type Variants } from "motion/react";
import { spring } from "./springs";

const VIEWPORT = { once: true, margin: "0px 0px -12% 0px" } as const;

type Tag = "div" | "section" | "li" | "ul" | "article" | "header" | "p" | "span";

/** Fades and lifts its content into place the first time it enters the viewport. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  as = "div",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: Tag;
  id?: string;
}) {
  const Component = m[as];
  return (
    <Component
      id={id}
      data-reveal
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ ...spring.reveal, delay }}
    >
      {children}
    </Component>
  );
}

const groupVariants: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  shown: { opacity: 1, y: 0, transition: spring.reveal },
};

/** Staggers the entrance of its <RevealItem> children. */
export function RevealGroup({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: Tag;
}) {
  const Component = m[as];
  return (
    <Component className={className} variants={groupVariants} initial="hidden" whileInView="shown" viewport={VIEWPORT}>
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
  const Component = m[as];
  return (
    <Component data-reveal className={className} variants={itemVariants}>
      {children}
    </Component>
  );
}
