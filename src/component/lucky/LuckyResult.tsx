"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatDrawDate } from "@/lib/lottery";
import { tap } from "@/lib/motion";
import { cn } from "@/lib/utils";
import useCartStore from "@/store/useCartStore";
import useToastStore from "@/store/useToastStore";
import type { Ticket } from "@/types/lottery.type";

export default function LuckyResult({
  ticket,
  onAgain,
  onClose,
}: {
  ticket: Ticket;
  onAgain: () => void;
  /** Dismiss the card; the boy heads back to his house. */
  onClose: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const inCart = useCartStore((s) => s.items.some((i) => i.num === ticket.num));
  const add = useCartStore((s) => s.add);
  const showToast = useToastStore((s) => s.show);

  // Escape closes the card, like any dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onAdd = () => {
    add(ticket);
    showToast(t("ticket.added"));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 30, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: "spring", stiffness: 240, damping: 20 }}
      aria-label={t("lucky.resultTitle")}
      className="relative rounded-2xl border bg-card/95 p-5 text-center shadow-xl backdrop-blur"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t("lucky.close")}
        className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <X className="size-4" aria-hidden />
      </button>
      <h2 className="font-display text-sm font-bold tracking-wide text-muted-foreground uppercase">
        🍀 {t("lucky.resultTitle")}
      </h2>
      <p
        role="img"
        aria-label={ticket.num}
        className="mt-3 flex justify-center gap-1.5 sm:gap-2"
      >
        {ticket.num.split("").map((digit, i) => (
          <motion.span
            // biome-ignore lint/suspicious/noArrayIndexKey: positional digits
            key={i}
            aria-hidden
            initial={{ opacity: 0, y: 20, rotateX: -80 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.15 + 0.1 * i, type: "spring", stiffness: 220 }}
            className="flex size-11 items-center justify-center rounded-lg border bg-secondary font-display text-2xl font-extrabold text-primary tabular-nums sm:size-14 sm:text-4xl"
          >
            {digit}
          </motion.span>
        ))}
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        {t("ticket.serial", { serial: ticket.serial })} ·{" "}
        {t("home.drawDate", { date: formatDrawDate(ticket.drawDate, locale) })}
      </p>
      <p className="mt-1 font-display text-lg font-bold text-primary tabular-nums">
        {t("common.amount", { value: ticket.price })}
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
        {inCart ? (
          <Link
            href="/cart"
            className={cn(buttonVariants({ size: "lg" }), "h-11 px-6")}
          >
            ✓ {t("lucky.viewCart")}
          </Link>
        ) : (
          <motion.div whileTap={tap}>
            <Button size="lg" className="h-11 w-full px-6" onClick={onAdd}>
              {t("lucky.addToCart")}
            </Button>
          </motion.div>
        )}
        <motion.div whileTap={tap}>
          <Button
            size="lg"
            variant="outline"
            className="h-11 w-full bg-card px-6"
            onClick={onAgain}
          >
            {t("lucky.again")}
          </Button>
        </motion.div>
      </div>
    </motion.section>
  );
}
