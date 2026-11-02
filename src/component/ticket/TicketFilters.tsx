"use client";

import { motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { TICKET_FILTERS } from "@/lib/lottery";
import { tap } from "@/lib/motion";
import { cn } from "@/lib/utils";
import useFilterStore from "@/store/useFilterStore";
import type { TicketSort } from "@/types/lottery.type";

const SORT_OPTIONS: TicketSort[] = ["lowToHigh", "highToLow"];

/**
 * Sidebar filter card, ported from the reference app's explore
 * `CategoryFilter`: heading + reset link, category checkboxes, a featured
 * toggle chip and radio sort. Always open from `lg`; collapsible on phones.
 */
export default function TicketFilters() {
  const t = useTranslations("filters");
  const [open, setOpen] = useState(false);
  const {
    categories,
    toggleCategory,
    isRecommended,
    setIsRecommended,
    sortBy,
    setSortBy,
    reset,
  } = useFilterStore();

  return (
    <section
      aria-label={t("title")}
      className="flex w-full flex-col rounded-[14px] border bg-card shadow-sm lg:max-h-[calc(100vh-11rem)]"
    >
      <div className="flex shrink-0 items-center justify-between p-4 lg:p-5">
        <h2 className="font-display text-base font-semibold">{t("title")}</h2>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="border-b border-primary pb-0.5 text-sm font-medium text-primary"
          >
            {t("reset")}
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={t("toggle")}
            className="lg:hidden"
          >
            <SlidersHorizontal className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out lg:min-h-0 lg:flex-1 lg:grid-rows-[1fr]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden lg:overflow-y-auto">
          <div className="px-4 pb-4 lg:px-5 lg:pb-5">
            <fieldset className="flex flex-col gap-3 border-b pb-5">
              <legend className="mb-3 text-sm text-muted-foreground">
                {t("category")}
              </legend>
              <div className="flex flex-col gap-1">
                {TICKET_FILTERS.map((key) => (
                  <label
                    key={key}
                    htmlFor={`category-${key}`}
                    className="flex cursor-pointer items-center gap-3 rounded-[10px] px-2 py-2 text-sm select-none hover:bg-muted"
                  >
                    <Checkbox
                      id={`category-${key}`}
                      checked={categories.includes(key)}
                      onCheckedChange={() => toggleCategory(key)}
                    />
                    {t(key)}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-5 flex flex-col gap-3 border-b pb-5">
              <h3 className="text-sm text-muted-foreground">{t("featured")}</h3>
              <motion.button
                type="button"
                whileTap={tap}
                aria-pressed={isRecommended}
                onClick={() => setIsRecommended(!isRecommended)}
                className={cn(
                  "w-fit rounded-[10px] px-4 py-2 text-left text-sm transition-colors",
                  isRecommended
                    ? "bg-primary/10 font-medium text-primary"
                    : "bg-muted",
                )}
              >
                {t("recommend")}
              </motion.button>
            </div>

            <fieldset className="mt-5 flex flex-col gap-3">
              <legend className="mb-3 text-sm text-muted-foreground">
                {t("sortBy")}
              </legend>
              {SORT_OPTIONS.map((value) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="radio"
                    name="ticket-sort"
                    checked={sortBy === value}
                    // Radios can't be unchecked natively; clicking the active one clears it.
                    onClick={() => sortBy === value && setSortBy(null)}
                    onChange={() => setSortBy(value)}
                    className="size-4 accent-primary"
                  />
                  {t(`sort.${value}`)}
                </label>
              ))}
            </fieldset>
          </div>
        </div>
      </div>
    </section>
  );
}
