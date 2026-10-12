"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import { spring } from "./springs";

/**
 * Loads Motion's DOM animation features once (keeps the bundle small) and
 * honours the visitor's reduced-motion preference everywhere: transforms are
 * skipped and only opacity changes remain.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={spring.ui}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
