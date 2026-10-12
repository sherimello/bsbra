"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, LazyMotion, domMax, m, type PanInfo } from "motion/react";
import { ChevronLeft, ChevronRight, Download, Play, X } from "lucide-react";
import { spring } from "@/components/motion/springs";
import { videoEmbedUrl } from "@/lib/utils";

export interface GridPhoto {
  id: string;
  src: string | null;
  video: string | null;
  caption: string;
  credit: string | null;
  download: boolean;
  width: number | null;
  height: number | null;
}

/** Apple's momentum projection (Designing Fluid Interfaces): where a flick would come to rest. */
function project(velocity: number, deceleration = 0.998) {
  return ((velocity / 1000) * deceleration) / (1 - deceleration);
}

/**
 * Photo grid with a full-screen viewer. The viewer tracks the finger 1:1,
 * uses the release velocity to decide whether a swipe advances, and can be
 * driven by arrow keys. Opens from and returns to the tapped thumbnail.
 */
export function PhotoGrid({
  photos,
  labels,
}: {
  photos: GridPhoto[];
  labels: { close: string; previous: string; next: string; download: string };
}) {
  const [index, setIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);

  const go = useCallback(
    (delta: number) => {
      setDirection(delta);
      setIndex((i) => (i === null ? i : (i + delta + photos.length) % photos.length));
    },
    [photos.length],
  );

  const close = useCallback(() => {
    setIndex(null);
    requestAnimationFrame(() => lastTrigger.current?.focus());
  }, []);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    const original = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, go, close]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const projected = info.offset.x + project(info.velocity.x);
    if (projected < -window.innerWidth * 0.25) go(1);
    else if (projected > window.innerWidth * 0.25) go(-1);
  };

  const current = index === null ? null : photos[index];
  const embed = current ? videoEmbedUrl(current.video) : null;

  return (
    <>
      <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {photos.map((photo, i) => (
          <li key={photo.id} className="mb-4 break-inside-avoid">
            <button
              type="button"
              onClick={(e) => {
                lastTrigger.current = e.currentTarget;
                setDirection(0);
                setIndex(i);
              }}
              className="group press relative block w-full overflow-hidden rounded-[var(--radius-card)] bg-bg-muted text-left"
              style={{ aspectRatio: photo.width && photo.height ? `${photo.width} / ${photo.height}` : "3 / 2" }}
              aria-label={photo.caption}
            >
              {photo.src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.src}
                  alt={photo.caption}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-[var(--ease-out-quint)] group-hover:scale-[1.03]"
                />
              )}
              {photo.video && (
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid size-14 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md">
                    <Play className="size-6 translate-x-0.5" />
                  </span>
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {/* Drag needs Motion's full feature set; load it only for the viewer. */}
      <LazyMotion features={domMax}>
      <AnimatePresence>
        {current && index !== null && (
          <m.div
            key="viewer"
            role="dialog"
            aria-modal="true"
            aria-label={current.caption}
            className="fixed inset-0 z-[80] flex flex-col bg-black/95 text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between gap-4 p-4">
              <p className="text-[0.8125rem] text-white/60 tabular">
                {index + 1} / {photos.length}
              </p>
              <div className="flex items-center gap-2">
                {current.download && current.src && (
                  <a
                    href={current.src}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="press grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
                    aria-label={labels.download}
                    title={labels.download}
                  >
                    <Download className="size-5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={close}
                  autoFocus
                  className="press grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
                  aria-label={labels.close}
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <m.div
                  key={current.id}
                  custom={direction}
                  className="absolute inset-0 flex items-center justify-center px-4 sm:px-16"
                  initial={{ opacity: 0, x: direction * 80 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -80 }}
                  transition={spring.ui}
                  drag={photos.length > 1 && !embed ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.55}
                  onDragEnd={onDragEnd}
                >
                  {embed ? (
                    <div className="aspect-video w-full max-w-5xl overflow-hidden rounded-2xl bg-black">
                      <iframe src={embed} title={current.caption} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                    </div>
                  ) : (
                    current.src && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={current.src}
                        alt={current.caption}
                        draggable={false}
                        className="max-h-full max-w-full rounded-lg object-contain select-none"
                      />
                    )
                  )}
                </m.div>
              </AnimatePresence>

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    className="press absolute top-1/2 left-3 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:grid"
                    aria-label={labels.previous}
                  >
                    <ChevronLeft className="size-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    className="press absolute top-1/2 right-3 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:grid"
                    aria-label={labels.next}
                  >
                    <ChevronRight className="size-6" />
                  </button>
                </>
              )}
            </div>

            <div className="p-5 text-center">
              <p className="text-[0.9375rem]">{current.caption}</p>
              {current.credit && <p className="mt-1 text-[0.75rem] text-white/50">© {current.credit}</p>}
            </div>
          </m.div>
        )}
      </AnimatePresence>
      </LazyMotion>
    </>
  );
}
