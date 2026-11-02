"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Ticket, User } from "lucide-react";
import { useTranslations } from "next-intl";
import LocaleSwitcher from "@/component/header/LocaleSwitcher";
import MainNav from "@/component/header/MainNav";
import ThemeToggle from "@/component/header/ThemeToggle";
import { Link } from "@/i18n/navigation";
import { iconButton } from "@/lib/styles";
import useCartStore from "@/store/useCartStore";

export default function Header() {
  const t = useTranslations();
  const count = useCartStore((s) => s.items.length);

  return (
    <header className="sticky top-0 z-40 border-b bg-card/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between px-4 md:flex-nowrap">
        <Link
          href="/"
          className="flex h-14 items-center gap-2 font-display text-lg font-extrabold text-foreground"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Ticket className="size-[18px]" aria-hidden />
          </span>
          {t("common.appName")}
          <span className="hidden rounded bg-highlight px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-highlight-foreground sm:inline">
            {t("common.official")}
          </span>
        </Link>

        <MainNav className="order-last h-10 w-full md:order-none md:h-14 md:w-auto" />

        <div className="flex h-14 items-center gap-1.5">
          <LocaleSwitcher />
          <ThemeToggle />
          <Link
            href="/cart"
            aria-label={t("header.cart", { count })}
            className={`${iconButton} relative`}
          >
            <ShoppingCart className="size-[18px]" aria-hidden />
            <motion.span
              key={count}
              initial={{ scale: 1.6 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              data-testid="cart-count"
              className="absolute -top-1 -right-1 flex size-[18px] items-center justify-center rounded-full bg-primary font-display text-[10px] font-bold text-primary-foreground"
            >
              {count}
            </motion.span>
          </Link>
          <Link
            href="/profile"
            aria-label={t("nav.profile")}
            className={iconButton}
          >
            <User className="size-[18px]" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}
