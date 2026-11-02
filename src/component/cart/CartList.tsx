"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import CartSummary from "@/component/cart/CartSummary";
import EmptyState from "@/component/ui/EmptyState";
import PageHeader from "@/component/ui/PageHeader";
import Container from "@/component/ui/Container";
import { useHydrated } from "@/hook/useHydrated";
import { formatDrawDate } from "@/lib/lottery";
import useCartStore from "@/store/useCartStore";

export default function CartList() {
  const t = useTranslations();
  const locale = useLocale();
  const hydrated = useHydrated(useCartStore.persist);
  const items = useCartStore((s) => s.items);
  const remove = useCartStore((s) => s.remove);

  return (
    <>
      <PageHeader
        title={t("cart.title")}
        description={t("cart.subtitle")}
        badge={hydrated && items.length > 0 ? String(items.length) : undefined}
      />
      <Container>
        {!hydrated ? (
          <p className="p-8 text-muted-foreground">{t("common.loading")}</p>
        ) : items.length === 0 ? (
          <EmptyState
            icon="🛒"
            title={t("cart.emptyTitle")}
            description={t("cart.emptySub")}
            actionHref="/"
            actionLabel={t("cart.browse")}
          />
        ) : (
          <div className="grid gap-6 px-4 py-8 lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-8">
            <ul>
              <AnimatePresence initial={false}>
                {items.map((ticket) => (
                  <motion.li
                    key={ticket.num}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                    className="mb-3 flex overflow-hidden rounded-[var(--radius)] border bg-card shadow-sm"
                  >
                    <div className="flex w-36 shrink-0 items-center justify-center bg-gradient-to-br from-hero to-hero-deep px-3 py-5 sm:w-52">
                      <span className="font-display text-xl font-extrabold tracking-[0.15em] text-white tabular-nums sm:text-3xl">
                        {ticket.num}
                      </span>
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-2 border-l-2 border-dashed px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-muted-foreground">
                          {t("ticket.serial", { serial: ticket.serial })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("home.drawDate", {
                            date: formatDrawDate(ticket.drawDate, locale),
                          })}
                        </p>
                        <p className="mt-1 font-display text-lg font-bold text-primary tabular-nums">
                          {t("common.amount", { value: ticket.price })}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(ticket.num)}
                        aria-label={t("cart.removeLabel", { num: ticket.num })}
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <CartSummary />
          </div>
        )}
      </Container>
    </>
  );
}
