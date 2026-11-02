"use client";

import { motion } from "framer-motion";
import { Bell, CircleDollarSign, LogOut, ScrollText, ShieldCheck, Ticket } from "lucide-react";
import { useTranslations } from "next-intl";
import CountUp from "@/component/profile/CountUp";
import { useRouter } from "@/i18n/navigation";
import { computeProfileStats } from "@/lib/lottery";
import { fadeUp, staggerContainer } from "@/lib/motion";
import useAuthStore from "@/store/useAuthStore";
import useOrderStore from "@/store/useOrderStore";
import useToastStore from "@/store/useToastStore";
import type { Draw } from "@/types/lottery.type";

const MENU = [
  { key: "myTickets", Icon: Ticket },
  { key: "history", Icon: ScrollText },
  { key: "bank", Icon: CircleDollarSign },
  { key: "notifications", Icon: Bell },
  { key: "security", Icon: ShieldCheck },
] as const;

export default function ProfileView({ draw }: { draw: Draw }) {
  const t = useTranslations();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const orders = useOrderStore((s) => s.orders);
  const showToast = useToastStore((s) => s.show);
  const stats = computeProfileStats(orders, draw);

  const onLogout = () => {
    logout();
    showToast(t("profile.loggedOut"));
    router.replace("/auth");
  };

  return (
    <div>
      <section className="bg-gradient-to-br from-hero to-hero-deep px-4 pt-7 pb-5 text-center text-white">
        <div className="mx-auto mb-3 flex size-20 items-center justify-center rounded-full border-[3px] border-white/50 bg-white/25 text-4xl">
          😊
        </div>
        <h1 className="font-display text-xl font-bold">{user?.name}</h1>
        <p className="mt-0.5 text-[13px] opacity-80">📱 {user?.identifier}</p>
      </section>

      <dl className="grid grid-cols-3 border-b bg-card">
        {[
          ["ticketsBought", stats.ticketsBought],
          ["drawsWon", stats.drawsWon],
          ["totalWon", stats.totalWon],
        ].map(([key, value]) => (
          <div key={key} className="border-r px-2 py-4 text-center last:border-r-0">
            <dd className="font-display text-xl font-extrabold text-primary tabular-nums">
              <CountUp value={value as number} />
            </dd>
            <dt className="mt-0.5 text-xs font-medium text-muted-foreground">
              {t(`profile.${key}`)}
            </dt>
          </div>
        ))}
      </dl>

      <motion.ul
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="mt-2"
      >
        {MENU.map(({ key, Icon }) => (
          <motion.li key={key} variants={fadeUp}>
            <button
              type="button"
              onClick={() => showToast(t("auth.comingSoon"))}
              className="flex w-full items-center gap-3 border-b bg-card px-4 py-3.5 text-left transition-colors hover:bg-muted"
            >
              <span className="flex size-9 items-center justify-center rounded-[10px] bg-secondary text-primary">
                <Icon className="size-[18px]" aria-hidden />
              </span>
              <span className="flex-1 text-[15px] font-medium">
                {t(`profile.${key}`)}
              </span>
              <span className="text-xl text-muted-foreground" aria-hidden>
                ›
              </span>
            </button>
          </motion.li>
        ))}
        <motion.li variants={fadeUp}>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 border-b bg-card px-4 py-3.5 text-left text-primary transition-colors hover:bg-muted"
          >
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-secondary">
              <LogOut className="size-[18px]" aria-hidden />
            </span>
            <span className="flex-1 text-[15px] font-medium">
              {t("profile.logout")}
            </span>
          </button>
        </motion.li>
      </motion.ul>

      <section className="p-4">
        <h2 className="mb-3 font-display text-base font-bold">
          {t("profile.history")}
        </h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("profile.noOrders")}</p>
        ) : (
          <ul className="space-y-2.5">
            {orders.map((order) => (
              <li key={order.id} className="rounded-lg border bg-card p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">
                    {t("profile.order", { id: order.id })}
                  </span>
                  <span className="font-display font-bold text-primary tabular-nums">
                    {t("common.amount", { value: order.total })}
                  </span>
                </div>
                <p className="mt-1 font-display text-xs tracking-widest text-muted-foreground tabular-nums">
                  {order.tickets.map((tk) => tk.num).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
