"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", key: "tickets" },
  { href: "/results", key: "results" },
  { href: "/winners", key: "winners" },
  { href: "/lucky", key: "lucky" },
  { href: "/chat", key: "chat" },
] as const;

export default function MainNav({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav aria-label={t("label")} className={cn("flex items-stretch gap-1", className)}>
      {ITEMS.map(({ href, key }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex items-center px-3.5 text-sm font-semibold whitespace-nowrap transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(key)}
            {active && (
              <motion.span
                layoutId="nav-indicator"
                className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
