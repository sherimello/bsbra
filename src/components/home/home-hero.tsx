"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import { buttonClass, ArrowLink } from "@/components/ui/button";

/**
 * Opening of the home page: a quiet, type-led statement over white, followed
 * by a wide photograph of a working yard that settles into place as you scroll.
 */
export function HomeHero({
  eyebrow,
  titleA,
  titleB,
  lede,
  primary,
  secondary,
  image,
  caption,
  credit,
}: {
  eyebrow: string;
  titleA: string;
  titleB: string;
  lede: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  image: { src: string; alt: string };
  caption: { place: string };
  credit: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: panelRef, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.45], reduced ? [1, 1] : [0.92, 1]);
  const radius = useTransform(scrollYProgress, [0, 0.45], reduced ? [28, 28] : [40, 28]);
  const artY = useTransform(scrollYProgress, [0, 1], reduced ? ["0%", "0%"] : ["-6%", "6%"]);
  const copyRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: copyProgress } = useScroll({ target: copyRef, offset: ["start start", "end start"] });
  const copyOpacity = useTransform(copyProgress, [0, 0.85], [1, 0]);
  const copyScale = useTransform(copyProgress, [0, 1], reduced ? [1, 1] : [1, 0.94]);
  const copyY = useTransform(copyProgress, [0, 1], reduced ? [0, 0] : [0, -40]);

  // Same blur + scale + fade + vertical glide as the site-wide reveal, staged line by line.
  const enter = (delay: number) => ({
    initial: reduced ? { opacity: 0 } : { opacity: 0, y: 26, filter: "blur(12px)", scale: 0.96 },
    animate: { opacity: 1, y: 0, filter: "blur(0px)", scale: 1 },
    transition: { duration: 1.05, ease: [0.16, 1, 0.3, 1] as const, delay },
  });

  return (
    <section data-no-reveal className="relative overflow-hidden bg-bg">
      <m.div
        ref={copyRef}
        style={{ opacity: copyOpacity, scale: copyScale, y: copyY }}
        className="mx-auto max-w-[1180px] origin-top px-4 pt-20 text-center will-change-transform sm:px-6 sm:pt-28 lg:px-8 lg:pt-32"
      >
        <m.p className="text-eyebrow text-fg-subtle" {...enter(0.05)}>
          {eyebrow}
        </m.p>
        <h1 className="text-display mx-auto mt-5 max-w-5xl text-balance">
          <m.span className="block" {...enter(0.12)}>
            {titleA}
          </m.span>
          <m.span className="block text-fg-faint" {...enter(0.24)}>
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
      </m.div>

      <div className="mx-auto max-w-[1380px] px-4 pt-16 pb-6 sm:px-6 sm:pt-20 lg:px-8">
        <m.div
          ref={panelRef}
          style={{ scale, borderRadius: radius }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 32, filter: "blur(12px)", scale: 0.94 }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
          transition={{ duration: 1.25, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="art-frame relative aspect-[4/3] w-full origin-top sm:aspect-[16/9] lg:aspect-[21/9]"
        >
          <m.div style={{ y: artY }} className="absolute -inset-y-[8%] inset-x-0">
            <Image src={image.src} alt={image.alt} fill loading="eager" fetchPriority="high" sizes="(min-width: 1380px) 1320px, 100vw" className="object-cover" />
          </m.div>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 text-[0.75rem] sm:p-6">
            <span className="rounded-full bg-bg/80 px-3 py-1.5 font-medium text-fg backdrop-blur-md">{caption.place}</span>
            {credit}
          </div>
        </m.div>
      </div>
    </section>
  );
}
