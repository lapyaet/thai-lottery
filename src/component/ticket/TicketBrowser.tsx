"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import TicketCard from "@/component/ticket/TicketCard";
import TicketFilters from "@/component/ticket/TicketFilters";
import TicketSearchForm from "@/component/ticket/TicketSearchForm";
import { filterTickets } from "@/lib/lottery";
import { staggerContainer } from "@/lib/motion";
import useFilterStore from "@/store/useFilterStore";
import type { Ticket } from "@/types/lottery.type";

export default function TicketBrowser({ tickets }: { tickets: Ticket[] }) {
  const t = useTranslations("home");
  const { search, categories, isRecommended, sortBy } = useFilterStore();
  const visible = filterTickets(tickets, {
    search,
    categories,
    isRecommended,
    sortBy,
  });

  return (
    <>
      <TicketSearchForm />
      <div className="flex flex-col gap-5 px-4 py-5 lg:flex-row lg:items-start lg:gap-6">
        <aside className="w-full shrink-0 lg:sticky lg:top-[calc(var(--header-h)+6rem)] lg:w-72">
          <TicketFilters />
        </aside>

        <div className="min-w-0 flex-1">
          <h2 className="mb-3 text-sm text-muted-foreground" aria-live="polite">
            {t("found", { count: visible.length })}
          </h2>
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
              <span className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <SearchX className="size-9" aria-hidden />
              </span>
              <p className="font-display text-lg font-bold">{t("empty")}</p>
              <p className="text-sm text-muted-foreground">{t("emptyHint")}</p>
            </div>
          ) : (
            <motion.ul
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-2.5 md:gap-4 xl:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {visible.map((ticket) => (
                  <TicketCard key={ticket.num} ticket={ticket} />
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>
      </div>
    </>
  );
}
