"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import FieldError from "@/component/ui/FieldError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkTicket } from "@/lib/lottery";
import { type CheckTicketValues, checkTicketSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import type { CheckResult, Draw } from "@/types/lottery.type";

export default function CheckTicketForm({ draw }: { draw: Draw }) {
  const t = useTranslations();
  const [checked, setChecked] = useState<{
    num: string;
    result: CheckResult;
  } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckTicketValues>({
    resolver: zodResolver(checkTicketSchema),
    defaultValues: { ticketNumber: "" },
  });

  const onSubmit = ({ ticketNumber }: CheckTicketValues) =>
    setChecked({ num: ticketNumber, result: checkTicket(ticketNumber, draw) });

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
      <h2 className="mb-4 font-display text-lg font-bold">
        🔍 {t("winners.checkTitle")}
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Label htmlFor="ticketNumber" className="mb-1.5">
          {t("winners.inputLabel")}
        </Label>
        <div className="flex gap-2">
          <Input
            id="ticketNumber"
            inputMode="numeric"
            maxLength={6}
            placeholder={t("winners.placeholder")}
            aria-invalid={!!errors.ticketNumber}
            aria-describedby={errors.ticketNumber ? "ticket-error" : undefined}
            className="h-11 text-base tracking-widest"
            {...register("ticketNumber")}
          />
          <Button type="submit" className="h-11 px-6">
            {t("winners.checkButton")}
          </Button>
        </div>
        <FieldError id="ticket-error" message={errors.ticketNumber?.message} />
      </form>

      <AnimatePresence mode="wait">
        {checked && (
          <motion.div
            key={checked.num}
            role="status"
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className={cn(
              "mt-3 rounded-lg border-[1.5px] p-3.5 text-center text-sm font-semibold",
              checked.result.won
                ? "border-success bg-success/10 text-success"
                : "border-border bg-muted text-muted-foreground",
            )}
          >
            {checked.result.won && checked.result.tier
              ? `🎉 ${t("winners.won", {
                  tier: t(`results.tiers.${checked.result.tier}`),
                  amount: t("common.amount", { value: checked.result.amount ?? 0 }),
                })}`
              : t("winners.lost", { num: checked.num })}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
