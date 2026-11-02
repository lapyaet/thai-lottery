"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";

/** Full-bleed page title band shared by cart and other utility pages. */
export default function PageHeader({
  title,
  description,
  badge,
}: {
  title: string;
  description?: string;
  badge?: string;
}) {
  return (
    <section className="relative w-full overflow-hidden border-b bg-gradient-to-b from-accent to-background">
      <div className="absolute -top-14 -right-14 size-44 rounded-full bg-highlight/30 md:size-64" />
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-7xl px-4 py-8 md:py-12"
      >
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-extrabold md:text-4xl">
            {title}
          </h1>
          {badge && (
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground md:text-sm">
              {badge}
            </span>
          )}
        </motion.div>
        {description && (
          <motion.p
            variants={fadeUp}
            className="mt-1.5 text-sm text-muted-foreground md:text-base"
          >
            {description}
          </motion.p>
        )}
      </motion.div>
    </section>
  );
}
