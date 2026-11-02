"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import EmptyState from "@/component/ui/EmptyState";
import FieldError from "@/component/ui/FieldError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHydrated } from "@/hook/useHydrated";
import { useRouter } from "@/i18n/navigation";
import { cartTotal, createOrder } from "@/lib/lottery";
import { type CheckoutValues, checkoutSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import useAuthStore from "@/store/useAuthStore";
import useCartStore from "@/store/useCartStore";
import useOrderStore from "@/store/useOrderStore";
import useToastStore from "@/store/useToastStore";
import type { PaymentMethod } from "@/types/lottery.type";

const METHODS: { value: PaymentMethod; icon: string }[] = [
  { value: "qr", icon: "📱" },
  { value: "bank", icon: "🏦" },
  { value: "card", icon: "💳" },
];

export default function CheckoutForm() {
  const t = useTranslations();
  const router = useRouter();
  const hydrated = useHydrated(useCartStore.persist);
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const addOrder = useOrderStore((s) => s.add);
  const showToast = useToastStore((s) => s.show);
  const user = useAuthStore((s) => s.user);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: user?.name ?? "",
      phone: "",
      nrc: "",
      paymentMethod: "qr",
    },
  });
  const method = useWatch({ control, name: "paymentMethod" });
  const total = cartTotal(items);

  if (!hydrated) return null;
  if (items.length === 0) {
    return (
      <EmptyState
        icon="🛒"
        title={t("checkout.emptyCart")}
        actionHref="/"
        actionLabel={t("cart.browse")}
      />
    );
  }

  const onSubmit = async (values: CheckoutValues) => {
    // Mock payment latency; replace with a real payment call.
    await new Promise((r) => setTimeout(r, 600));
    addOrder(createOrder(items, values.paymentMethod));
    clear();
    showToast(t("checkout.success"));
    router.push("/profile");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h1 className="sr-only">{t("checkout.title")}</h1>

      <section className="border-b p-4">
        <h2 className="mb-3 font-display text-[15px] font-bold">
          📋 {t("checkout.summary")}
        </h2>
        <ul>
          {items.map((ticket) => (
            <li
              key={ticket.num}
              className="flex items-center justify-between border-b py-2 last:border-b-0"
            >
              <span className="text-sm text-muted-foreground">
                {t("ticket.label", { num: ticket.num })}
              </span>
              <span className="text-sm font-semibold tabular-nums">
                {t("common.amount", { value: ticket.price })}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3.5 border-b p-4">
        <h2 className="font-display text-[15px] font-bold">
          👤 {t("checkout.buyer")}
        </h2>
        <div>
          <Label htmlFor="fullName" className="mb-1.5">
            {t("checkout.fullName")} *
          </Label>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder={t("checkout.fullNamePlaceholder")}
            aria-invalid={!!errors.fullName}
            {...register("fullName")}
          />
          <FieldError message={errors.fullName?.message} />
        </div>
        <div>
          <Label htmlFor="phone" className="mb-1.5">
            {t("checkout.phone")} *
          </Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder={t("checkout.phonePlaceholder")}
            aria-invalid={!!errors.phone}
            {...register("phone")}
          />
          <FieldError message={errors.phone?.message} />
        </div>
        <div>
          <Label htmlFor="nrc" className="mb-1.5">
            {t("checkout.nrc")} *
          </Label>
          <Input
            id="nrc"
            placeholder={t("checkout.nrcPlaceholder")}
            aria-invalid={!!errors.nrc}
            {...register("nrc")}
          />
          <FieldError message={errors.nrc?.message} />
        </div>
      </section>

      <fieldset className="border-b p-4">
        <legend className="mb-3 font-display text-[15px] font-bold">
          💳 {t("checkout.payment")}
        </legend>
        <div className="space-y-2.5">
          {METHODS.map(({ value, icon }) => (
            <label
              key={value}
              className={cn(
                "relative flex cursor-pointer items-center gap-3 rounded-lg border-2 px-3.5 py-3 transition-colors",
                method === value ? "border-primary bg-secondary" : "border-border",
              )}
            >
              <input
                type="radio"
                value={value}
                className="sr-only"
                {...register("paymentMethod")}
              />
              <span className="text-2xl" aria-hidden>
                {icon}
              </span>
              <span className="flex-1 text-sm font-semibold">
                {t(`checkout.methods.${value}`)}
              </span>
              <span className="flex size-[18px] items-center justify-center rounded-full border-2 border-border">
                {method === value && (
                  <motion.span
                    layoutId="payment-dot"
                    className="size-2 rounded-full bg-primary"
                  />
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center justify-between border-t-2 border-primary bg-secondary px-4 py-3.5">
        <span className="font-display text-[15px] font-bold text-primary">
          {t("checkout.total")}
        </span>
        <span className="font-display text-[22px] font-extrabold text-primary tabular-nums">
          {t("common.amount", { value: total })}
        </span>
      </div>

      <div className="p-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full text-base"
        >
          {isSubmitting ? t("checkout.processing") : `✅ ${t("checkout.confirm")}`}
        </Button>
        <p className="mt-2.5 text-center text-xs text-muted-foreground">
          {t("checkout.terms")}
        </p>
      </div>
    </form>
  );
}
