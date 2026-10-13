import type { Transition } from "motion/react";

/**
 * Spring presets. Apple's guidance: critically damped (no overshoot) for UI
 * that simply appears; a little bounce only when a gesture carried momentum.
 * Motion's `bounce` ≈ 1 − damping ratio, `visualDuration` ≈ response.
 */
export const spring = {
  /** Default UI movement — settles with butter-smooth easing. */
  ui: { type: "spring", bounce: 0.05, visualDuration: 0.45 } satisfies Transition,
  /** Content entering the viewport — slower, calmer, pronounced ease. */
  reveal: { type: "spring", bounce: 0, visualDuration: 1.05 } satisfies Transition,
  /** Sheets and drawers. */
  sheet: { type: "spring", bounce: 0.08, visualDuration: 0.4 } satisfies Transition,
  /** Small presses and toggles. */
  snappy: { type: "spring", bounce: 0, visualDuration: 0.22 } satisfies Transition,
};

export const easeOutQuint = [0.16, 1, 0.3, 1] as const;
