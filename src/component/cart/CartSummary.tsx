"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cartTotal } from "@/lib/lottery";
import { cn } from "@/lib/utils";
import useCartStore from "@/store/useCartStore";

export default function CartSummary() {
  const t = useTranslations();
  const items = useCartStore((s) => s.items);
  const total = cartTotal(items);

  return (
    <aside
      aria-label={t("cart.summary")}
      className="rounded-2xl border bg-card p-5 shadow-sm lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]"
    >
      <h2 className="font-display text-lg font-bold">{t("cart.summary")}</h2>
      <dl className="mt-4 space-y-2.5 border-b pb-4 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{t("cart.quantity")}</dt>
          <dd className="font-semibold">
            {t("cart.quantityValue", { count: items.length })}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{t("cart.subtotal")}</dt>
          <dd className="font-semibold tabular-nums">
            {t("common.amount", { value: total })}
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex items-center justify-between">
        <span className="font-semibold">{t("cart.total")}</span>
        <motion.span
          key={total}
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          className="font-display text-2xl font-extrabold text-primary tabular-nums"
        >
          {t("common.amount", { value: total })}
        </motion.span>
      </div>
      <Link
        href="/checkout"
        className={cn(buttonVariants({ size: "lg" }), "mt-5 h-12 w-full text-base")}
      >
        {t("cart.checkout")}
      </Link>
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost", size: "lg" }),
          "mt-2 h-10 w-full",
        )}
      >
        {t("cart.continue")}
      </Link>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-4" aria-hidden />
        {t("cart.secure")}
      </p>
    </aside>
  );
}
