"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { fadeUp, staggerContainer } from "@/lib/motion";

/** Full-bleed header; the ticket checker card is passed in as children. */
export default function WinnerHero({
  date,
  children,
}: {
  date: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("winners");

  return (
    <section className="relative w-full overflow-hidden border-b bg-gradient-to-b from-accent to-background text-foreground">
      <div className="absolute -top-16 -right-16 size-56 rounded-full bg-highlight/30 md:size-80" />
      <div className="absolute -bottom-20 -left-12 size-44 rounded-full bg-highlight/20 md:size-64" />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-7xl px-4 py-10 text-center md:py-16"
      >
        <motion.div
          variants={fadeUp}
          className="text-5xl md:text-6xl"
          animate={{ y: [0, -10, 0], rotate: [0, -8, 8, 0] }}
          transition={{ duration: 1.4, repeat: 2, ease: "easeInOut" }}
          aria-hidden
        >
          🎉
        </motion.div>
        <motion.h1
          variants={fadeUp}
          className="mt-3 font-display text-3xl font-extrabold md:text-5xl"
        >
          {t("title")}
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="mx-auto mt-3 w-fit rounded-full border bg-card px-4 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground md:text-sm"
        >
          {t("subtitle", { date })}
        </motion.p>
        <motion.div variants={fadeUp} className="mx-auto mt-7 max-w-xl text-left">
          {children}
        </motion.div>
      </motion.div>
    </section>
  );
}
