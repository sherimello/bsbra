"use client";

import Link from "next/link";
import { useRef } from "react";
import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import { buttonClass, ArrowLink } from "@/components/ui/button";
import { spring } from "@/components/motion/springs";

/**
 * Opening of the home page: a quiet, type-led statement over white, followed
 * by a wide chart-like artwork panel that settles into place as you scroll.
 */
export function HomeHero({
  eyebrow,
  titleA,
  titleB,
  lede,
  primary,
  secondary,
  art,
  caption,
}: {
  eyebrow: string;
  titleA: string;
  titleB: string;
  lede: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  art: string;
  caption: { place: string; coords: string };
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: panelRef, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.45], reduced ? [1, 1] : [0.92, 1]);
  const radius = useTransform(scrollYProgress, [0, 0.45], reduced ? [28, 28] : [40, 28]);
  const artY = useTransform(scrollYProgress, [0, 1], reduced ? ["0%", "0%"] : ["-6%", "6%"]);

  const enter = (delay: number, y = 18) => ({
    initial: { opacity: 0, y: reduced ? 0 : y },
    animate: { opacity: 1, y: 0 },
    transition: { ...spring.reveal, delay },
  });

  return (
    <section className="relative overflow-hidden bg-bg">
      <div className="mx-auto max-w-[1180px] px-4 pt-20 text-center sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
        <m.p className="text-eyebrow text-fg-subtle" {...enter(0.05, 10)}>
          {eyebrow}
        </m.p>
        <h1 className="text-display mx-auto mt-5 max-w-5xl text-balance">
          <m.span className="block" {...enter(0.12, 26)}>
            {titleA}
          </m.span>
          <m.span className="block text-fg-faint" {...enter(0.24, 26)}>
            {titleB}
          </m.span>
        </h1>
        <m.p className="text-lede mx-auto mt-7 max-w-2xl text-pretty text-fg-subtle" {...enter(0.38)}>
          {lede}
        </m.p>
        <m.div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-4" {...enter(0.48)}>
          <Link href={primary.href} className={buttonClass("primary", "lg")}>
            {primary.label}
          </Link>
          <ArrowLink href={secondary.href} className="text-[1.0625rem]">
            {secondary.label}
          </ArrowLink>
        </m.div>
      </div>

      <div className="mx-auto max-w-[1380px] px-4 pt-16 pb-6 sm:px-6 sm:pt-20 lg:px-8">
        <m.div
          ref={panelRef}
          style={{ scale, borderRadius: radius }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="art-frame relative aspect-[4/3] w-full origin-top sm:aspect-[16/9] lg:aspect-[21/9]"
        >
          <m.div style={{ y: artY }} className="absolute -inset-y-[8%] inset-x-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={art} alt="" fetchPriority="high" decoding="async" className="h-full w-full object-cover" />
          </m.div>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-[0.75rem] text-fg-subtle sm:p-7">
            <span className="rounded-full bg-bg/80 px-3 py-1.5 font-medium text-fg backdrop-blur-md">{caption.place}</span>
            <span className="hidden font-mono tracking-tight sm:block">{caption.coords}</span>
          </div>
        </m.div>
      </div>
    </section>
  );
}
