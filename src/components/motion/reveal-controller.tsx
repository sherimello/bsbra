"use client";

import { useEffect } from "react";

/**
 * Site-wide scroll reveal. Every *outermost* content block inside <main> and
 * the footer (see REVEAL_SELECTOR, mirrored in globals.css) enters with the
 * same blur + scale + fade. The CSS entrance covers the first paint; this
 * controller makes it persistent: blocks that leave the viewport are reset
 * (while off-screen, so nothing visibly pops) and play the entrance again
 * each time they scroll back into view, staggered when several arrive at once.
 *
 * It only uses the Web Animations API — no attributes or classes change — so
 * React's markup is never touched and hydration is unaffected.
 */

const TARGETS =
  '[data-reveal], article, li, figure, blockquote, form, table, dl, pre, .hairline, .art-frame, h1, h2, h3, h4, h5, h6, p, img, video, hr, svg[role="img"], .press';
const SKIP = 'header, nav, [role="dialog"], [data-no-reveal]';
export const REVEAL_SELECTOR = `:is(${TARGETS}):not(:is(${TARGETS}) *):not(:is(${SKIP}) *):not(:is(${SKIP}))`;

const NO_BLUR = 'img[src*="/art/"]';

const HIDDEN = { opacity: 0, filter: "blur(16px)", transform: "translate3d(0, 44px, 0) scale(0.94)" };
const SHOWN = { opacity: 1, filter: "blur(0px)", transform: "translate3d(0, 0, 0) scale(1)" };
const DURATION = 1200;
const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";
const STAGGER = 90;
const MAX_STAGGER_STEPS = 6;

type State = { hidden: Animation | null; reveal: Animation | null };

export function RevealController() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    const roots = [document.querySelector("main"), document.querySelector("body > footer, footer")].filter(
      (el): el is HTMLElement => !!el,
    );
    const states = new WeakMap<Element, State>();
    const tracked = new Set<Element>();

    // Artwork carries its own filter in dark mode, so it reveals without blur.
    const frames = (el: Element) => {
      const ownFilter = el.matches(NO_BLUR);
      const strip = (k: typeof HIDDEN) => (ownFilter ? { opacity: k.opacity, transform: k.transform } : k);
      return [strip(HIDDEN), strip(SHOWN)];
    };

    const hide = (el: Element) => {
      const state = states.get(el);
      if (!state || state.hidden) return;
      state.reveal?.cancel();
      state.reveal = null;
      state.hidden = el.animate([frames(el)[0]], { duration: 0, fill: "forwards" });
    };

    const reveal = (el: Element, delay: number) => {
      const state = states.get(el);
      if (!state?.hidden) return;
      const anim = el.animate(frames(el), { duration: DURATION, easing: EASING, delay, fill: "backwards" });
      state.hidden.cancel();
      state.hidden = null;
      state.reveal = anim;
      anim.onfinish = () => {
        if (state.reveal === anim) state.reveal = null;
      };
    };

    // Reveal once a block is a little way into the viewport…
    const enter = new IntersectionObserver(
      (entries) => {
        const arriving = entries
          .filter((e) => e.isIntersecting && states.get(e.target)?.hidden)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
        arriving.forEach((e, i) => reveal(e.target, Math.min(i, MAX_STAGGER_STEPS) * STAGGER));
      },
      { rootMargin: "0px 0px -4% 0px" },
    );
    // …and reset it only when it is well clear of the viewport, so the reset is never seen.
    const leave = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (!e.isIntersecting) hide(e.target);
      },
      { rootMargin: "20% 0px 20% 0px" },
    );

    const track = (el: Element) => {
      if (tracked.has(el)) return;
      tracked.add(el);
      states.set(el, { hidden: null, reveal: null });
      enter.observe(el);
      leave.observe(el);
    };

    const untrack = (el: Element) => {
      if (!tracked.delete(el)) return;
      enter.unobserve(el);
      leave.unobserve(el);
    };

    // New blocks that are off-screen are reset straight away, so they play their
    // entrance when scrolled to; blocks already on screen keep the CSS entrance.
    const scan = (root: ParentNode) => {
      const found = [...root.querySelectorAll(REVEAL_SELECTOR)];
      if (root instanceof Element && root.matches(REVEAL_SELECTOR)) found.unshift(root);
      const fresh = found.filter((el) => !tracked.has(el));
      const offscreen = fresh.filter((el) => {
        const r = el.getBoundingClientRect();
        return r.top >= window.innerHeight || r.bottom <= 0;
      });
      fresh.forEach(track);
      offscreen.forEach(hide);
    };

    roots.forEach(scan);

    // Client navigations, streamed Suspense content and filtered lists add new blocks.
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) scan(node);
        });
        record.removedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          untrack(node);
          node.querySelectorAll("*").forEach(untrack);
        });
      }
    });
    roots.forEach((root) => mutations.observe(root, { childList: true, subtree: true }));

    const stop = () => {
      enter.disconnect();
      leave.disconnect();
      mutations.disconnect();
      tracked.forEach((el) => {
        const state = states.get(el);
        state?.hidden?.cancel();
        state?.reveal?.cancel();
      });
      tracked.clear();
    };
    reduced.addEventListener("change", stop, { once: true });
    return () => {
      reduced.removeEventListener("change", stop);
      stop();
    };
  }, []);

  return null;
}
