"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  fadeUp,
  staggerContainer,
  useRevealProps,
  viewportOnce,
} from "@/lib/motion";
import type { Draw, PrizeGroup, PrizeTier } from "@/types/lottery.type";

const OTHER_TIERS: PrizeTier[] = ["second", "third", "neighbor"];
const DIGIT_TIERS: PrizeTier[] = ["front3", "last3", "last2"];

const pick = (draw: Draw, tiers: PrizeTier[]) =>
  tiers
    .map((tier) => draw.groups.find((g) => g.tier === tier))
    .filter((g): g is PrizeGroup => !!g);

export default function WinnerList({ draw }: { draw: Draw }) {
  const t = useTranslations();
  const reveal = useRevealProps();
  const first = draw.groups.find((g) => g.tier === "first");

  return (
    <motion.section
      id="all"
      variants={staggerContainer}
      {...reveal}
      viewport={viewportOnce}
      className="scroll-mt-32 space-y-6 px-4 py-10"
    >
      <motion.h2 variants={fadeUp} className="font-display text-xl font-bold md:text-2xl">
        {t("winners.allWinners")}
      </motion.h2>

      {first && (
        <motion.article
          variants={fadeUp}
          className="rounded-2xl bg-gradient-to-br from-hero to-hero-deep p-6 text-center text-white md:p-8"
        >
          <h3 className="text-sm font-semibold tracking-wide text-white/80">
            🥇 {t("results.tiers.first")}
          </h3>
          <p className="mt-2 font-display text-4xl font-extrabold tracking-[0.2em] text-highlight tabular-nums md:text-6xl">
            {first.numbers[0]}
          </p>
          <p className="mt-2 font-display text-lg font-bold md:text-2xl">
            {t("common.amount", { value: first.amount })}
          </p>
        </motion.article>
      )}

      <ul className="grid gap-4 md:grid-cols-3">
        {pick(draw, OTHER_TIERS).map((group) => (
          <motion.li
            key={group.tier}
            variants={fadeUp}
            className="overflow-hidden rounded-[var(--radius)] border bg-card shadow-sm"
          >
            <h3 className="flex items-center justify-between bg-success px-4 py-2.5 font-display text-sm font-bold text-success-foreground">
              <span>{t(`results.tiers.${group.tier}`)}</span>
              <span>{t("common.amount", { value: group.amount })}</span>
            </h3>
            <ul className="flex flex-wrap gap-2 p-4">
              {group.numbers.map((n) => (
                <li
                  key={n}
                  className="rounded-lg bg-secondary px-3 py-1.5 font-display text-sm font-bold tracking-widest text-secondary-foreground tabular-nums"
                >
                  {n}
                </li>
              ))}
            </ul>
          </motion.li>
        ))}
      </ul>

      <motion.div
        variants={fadeUp}
        className="rounded-[var(--radius)] border bg-card p-4 shadow-sm md:p-5"
      >
        <h3 className="font-display text-base font-bold">{t("results.tabs.digit")}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("winners.digitHint")}
        </p>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {pick(draw, DIGIT_TIERS).map((group) => (
            <li key={group.tier} className="rounded-lg bg-muted p-3">
              <p className="text-xs font-semibold text-muted-foreground">
                {t(`results.tiers.${group.tier}`)}
              </p>
              <p className="mt-1 font-display text-lg font-bold tracking-widest tabular-nums">
                {group.numbers.join(" · ")}
              </p>
              <p className="text-xs font-semibold text-primary">
                {t("common.amount", { value: group.amount })}
              </p>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="flex items-start gap-3 rounded-[var(--radius)] border bg-card p-4 shadow-sm md:items-center md:p-5"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
          <MapPin className="size-5" aria-hidden />
        </span>
        <div>
          <h3 className="text-sm text-muted-foreground">{t("winners.claimLocation")}</h3>
          <p className="font-semibold">{t("winners.claimValue")}</p>
        </div>
      </motion.div>
    </motion.section>
  );
}
