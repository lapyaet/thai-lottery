import type { Variants } from "framer-motion";
import { useReducedMotion } from "framer-motion";

/** Shared Framer Motion variants so every section animates consistently. */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};

export const tap = { scale: 0.96 };

export const viewportOnce = { once: true, margin: "0px 0px 80px 0px" };

/**
 * `whileInView` leaves content at `hidden` for anyone who never triggers the
 * observer (reduced-motion users, tests). Skip straight to `show` for them.
 */
export function useRevealProps() {
  const reduced = useReducedMotion();
  return reduced
    ? { initial: "show" as const, whileInView: "show" as const }
    : { initial: "hidden" as const, whileInView: "show" as const };
}
