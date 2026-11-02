"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { useEffect } from "react";

export default function CountUp({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const mv = useMotionValue(reduced ? value : 0);
  const display = useTransform(mv, (v) => Math.round(v).toLocaleString("en-US"));

  useEffect(() => {
    if (reduced) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.8, ease: "easeOut" });
    return () => controls.stop();
  }, [value, reduced, mv]);

  return <motion.span>{display}</motion.span>;
}
