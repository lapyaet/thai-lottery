"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

export default function ResultHero({
  date,
  number,
  amount,
}: {
  date: string;
  number: string;
  amount: number;
}) {
  const t = useTranslations();

  return (
    <section className="relative w-full overflow-hidden border-b bg-gradient-to-b from-accent to-background text-foreground">
      <div className="absolute -top-16 -left-16 size-56 rounded-full bg-highlight/30 md:size-80" />
      <div className="absolute -right-12 -bottom-20 size-44 rounded-full bg-highlight/20 md:size-64" />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-7xl px-4 py-10 text-center md:py-16"
      >
        <motion.p
          variants={fadeUp}
          className="mx-auto w-fit rounded-full border bg-card px-4 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground md:text-sm"
        >
          {t("results.drawDate", { date })}
        </motion.p>
        <motion.h1
          variants={fadeUp}
          className="mt-4 font-display text-xl font-extrabold md:text-3xl"
        >
          🥇 {t("results.firstPrize")}
        </motion.h1>

        <p
          role="img"
          aria-label={number}
          className="mt-5 flex justify-center gap-1.5 sm:gap-3"
        >
          {number.split("").map((digit, i) => (
            <motion.span
              // biome-ignore lint/suspicious/noArrayIndexKey: positional digits
              key={i}
              aria-hidden
              initial={{ opacity: 0, y: 28, rotateX: -80 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.12 * i, type: "spring", stiffness: 220 }}
              className="flex size-12 items-center justify-center rounded-xl border bg-card font-display text-3xl font-extrabold text-primary shadow-sm tabular-nums sm:size-16 sm:text-5xl md:size-24 md:rounded-2xl md:text-7xl"
            >
              {digit}
            </motion.span>
          ))}
        </p>

        <motion.p
          variants={fadeUp}
          className="mt-5 font-display text-2xl font-bold tabular-nums md:text-4xl"
        >
          {t("common.amount", { value: amount })}
          <span className="ml-2 text-sm font-medium text-muted-foreground md:text-base">
            · {t("results.winnerCount", { count: 1 })}
          </span>
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="mt-6 flex justify-center gap-3"
        >
          <Link
            href="/winners"
            className={cn(buttonVariants({ size: "lg" }), "h-11 px-6 text-base")}
          >
            {t("results.checkTicket")}
          </Link>
          <Link
            href="/winners#all"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 bg-card px-6 text-base",
            )}
          >
            {t("results.viewWinners")}
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
