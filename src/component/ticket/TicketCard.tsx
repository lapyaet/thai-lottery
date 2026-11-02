"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { fadeUp, tap } from "@/lib/motion";
import useCartStore from "@/store/useCartStore";
import useToastStore from "@/store/useToastStore";
import type { Ticket } from "@/types/lottery.type";

export default function TicketCard({ ticket }: { ticket: Ticket }) {
  const t = useTranslations();
  const inCart = useCartStore((s) => s.items.some((i) => i.num === ticket.num));
  const toggle = useCartStore((s) => s.toggle);
  const showToast = useToastStore((s) => s.show);

  const onToggle = () => {
    const added = toggle(ticket);
    showToast(t(added ? "ticket.added" : "ticket.removed"));
  };

  return (
    <motion.li
      layout
      variants={fadeUp}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -3 }}
      className="overflow-hidden rounded-[var(--radius)] border bg-card shadow-sm transition-shadow hover:shadow-lg"
      aria-label={t("ticket.label", { num: ticket.num })}
    >
      <div className="flex items-center justify-between bg-gradient-to-r from-hero to-hero-deep px-3.5 py-2">
        <div>
          <div className="font-display text-2xl font-extrabold tracking-[0.15em] text-white tabular-nums">
            {ticket.num}
          </div>
          <div className="mt-0.5 text-[11px] font-semibold tracking-wide text-white/65">
            {t("ticket.serial", { serial: ticket.serial })}
          </div>
        </div>
        <span className="text-2xl opacity-70" aria-hidden>
          🇲🇲
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 px-3.5 py-3">
        <div className="font-display text-lg font-bold text-primary tabular-nums">
          {t("common.amount", { value: ticket.price })}
        </div>
        <motion.div whileTap={tap}>
          <Button
            size="sm"
            variant={inCart ? "outline" : "default"}
            onClick={onToggle}
            aria-pressed={inCart}
          >
            {t(inCart ? "ticket.inCart" : "ticket.add")}
          </Button>
        </motion.div>
      </div>
    </motion.li>
  );
}
