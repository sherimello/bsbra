"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ShowcaseYard {
  slug: string;
  href: string;
  name: string;
  status: string;
  statusLabel: string;
  certifier: string | null;
  image: string | null;
  location: string;
}

/** Horizontally scrolling yard cards with scroll-snap and paddle buttons. */
export function YardShowcase({
  yards,
  labels,
}: {
  yards: ShowcaseYard[];
  labels: { previous: string; next: string; certifiedBy: string };
}) {
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = () => {
    const el = track.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  };

  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const paddle =
    "press grid size-9 place-items-center rounded-full bg-bg-muted text-fg-muted transition-[opacity,color] hover:text-fg disabled:opacity-35";

  return (
    <div className="relative">
      <ul
        ref={track}
        onScroll={update}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto scroll-smooth px-4 pb-2 scrollbar-none sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8"
      >
        {yards.map((yard) => (
          <li key={yard.slug} className="w-[80%] shrink-0 snap-start sm:w-[46%] lg:w-[31.6%]">
            <Link href={yard.href} className="group block">
              <div className="art-frame aspect-[4/3] rounded-[var(--radius-tile)]">
                {yard.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={yard.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.6s] ease-[var(--ease-out-quint)] group-hover:scale-[1.04]"
                  />
                )}
              </div>
              <div className="px-1 pt-5">
                <p className="flex items-center gap-2 text-[0.8125rem] text-fg-subtle">
                  <span
                    aria-hidden
                    className={cn("size-1.5 rounded-full", yard.status === "green" ? "bg-ok" : "bg-fg-faint")}
                  />
                  {yard.statusLabel}
                </p>
                <h3 className="mt-1.5 text-[1.375rem] leading-tight font-semibold tracking-[-0.024em] text-fg">
                  {yard.name}
                </h3>
                <p className="mt-1 text-[0.9375rem] text-fg-subtle">
                  {yard.location}
                  {yard.certifier && (
                    <>
                      {" · "}
                      {labels.certifiedBy} {yard.certifier}
                    </>
                  )}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex justify-end gap-2.5">
        <button type="button" onClick={() => page(-1)} disabled={edge.start} aria-label={labels.previous} className={paddle}>
          <ChevronLeft className="size-[1.125rem]" />
        </button>
        <button type="button" onClick={() => page(1)} disabled={edge.end} aria-label={labels.next} className={paddle}>
          <ChevronRight className="size-[1.125rem]" />
        </button>
      </div>
    </div>
  );
}
