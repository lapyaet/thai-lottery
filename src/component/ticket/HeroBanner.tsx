"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

export default function HeroBanner({
  date,
  prize,
}: {
  date: string;
  prize: number;
}) {
  const t = useTranslations();

  return (
    <section className="relative w-full overflow-hidden border-b bg-gradient-to-b from-accent to-background text-foreground">
      <div className="absolute -top-16 -right-16 size-56 rounded-full bg-highlight/30 md:size-80" />
      <div className="absolute -bottom-20 -left-12 size-44 rounded-full bg-highlight/20 md:size-64" />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-7xl px-4 py-10 text-center md:py-20"
      >
        <motion.p
          variants={fadeUp}
          className="mx-auto w-fit rounded-full border bg-card px-4 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground md:text-sm"
        >
          {t("home.drawDate", { date })}
        </motion.p>
        <motion.h1
          variants={fadeUp}
          className="mt-4 font-display text-2xl font-extrabold text-balance sm:text-4xl md:text-5xl"
        >
          {t("home.title")}
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="mt-1 font-display text-5xl font-extrabold tracking-tight text-primary tabular-nums sm:text-7xl md:text-8xl"
        >
          {t("common.amount", { value: prize })}
        </motion.p>
        <motion.p
          variants={fadeUp}
          className="mt-2 text-sm text-muted-foreground md:text-base"
        >
          {t("home.prizeCaption")}
        </motion.p>
        <motion.div
          variants={fadeUp}
          className="mt-6 flex justify-center gap-3 md:mt-8"
        >
          <Link
            href="/results"
            className={cn(buttonVariants({ size: "lg" }), "h-11 px-6 text-base")}
          >
            {t("home.viewResults")}
          </Link>
          <Link
            href="/winners"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 bg-card px-6 text-base",
            )}
          >
            {t("home.viewWinners")}
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
