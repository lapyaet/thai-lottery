"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import type { PrizeGroup, PrizeTier } from "@/types/lottery.type";

const TABS = [
  { key: "top", tiers: ["second", "third", "neighbor"] },
  { key: "digit", tiers: ["front3", "last3", "last2"] },
] as const satisfies { key: string; tiers: readonly PrizeTier[] }[];

type TabKey = (typeof TABS)[number]["key"];

export default function PrizeTabs({ groups }: { groups: PrizeGroup[] }) {
  const t = useTranslations("results");
  const tc = useTranslations("common");
  const id = useId();
  const [active, setActive] = useState<TabKey>("top");
  const tab = TABS.find((x) => x.key === active) ?? TABS[0];
  const rows = tab.tiers
    .map((tier) => groups.find((g) => g.tier === tier))
    .filter((g): g is PrizeGroup => !!g);

  return (
    <section className="px-4 py-8">
      <div
        role="tablist"
        aria-label={t("prizesLabel")}
        className="mb-5 flex gap-1 border-b"
      >
        {TABS.map(({ key }) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`${id}-tab-${key}`}
            aria-selected={active === key}
            aria-controls={`${id}-panel`}
            onClick={() => setActive(key)}
            className={cn(
              "relative px-4 py-3 text-sm font-semibold transition-colors md:text-base",
              active === key
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`tabs.${key}`)}
            {active === key && (
              <motion.span
                layoutId="prize-tab"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${active}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3"
          >
            {rows.map((group) => (
              <li
                key={group.tier}
                className="flex flex-col gap-3 rounded-[var(--radius)] border bg-card p-4 shadow-sm md:flex-row md:items-center md:gap-6 md:p-5"
              >
                <div className="md:w-56 md:shrink-0">
                  <h3 className="font-display text-base font-bold md:text-lg">
                    {t(`tiers.${group.tier}`)}
                  </h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    <span className="font-display font-bold text-primary tabular-nums">
                      {t("amountEach", { amount: tc("amount", { value: group.amount }) })}
                    </span>
                  </p>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {group.numbers.map((n) => (
                    <li
                      key={n}
                      className="rounded-lg bg-secondary px-3 py-1.5 font-display text-sm font-bold tracking-widest text-secondary-foreground tabular-nums md:text-base"
                    >
                      {n}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>
    </section>
  );
}
