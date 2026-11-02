"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Eye, EyeOff, Ticket } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import FieldError from "@/component/ui/FieldError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import {
  type LoginValues,
  loginSchema,
  type SignupValues,
  signupSchema,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";
import useAuthStore from "@/store/useAuthStore";
import useToastStore from "@/store/useToastStore";

type Mode = "login" | "signup";

/** Only allow same-site relative redirects. */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/profile";
}

export default function AuthForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [mode, setMode] = useState<Mode>("login");
  const showToast = useToastStore((s) => s.show);

  return (
    <div className="bg-gradient-to-b from-accent to-background">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 lg:min-h-[calc(100vh-var(--header-h))] lg:grid-cols-2 lg:gap-16 lg:py-16">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center lg:text-left"
        >
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground lg:mx-0">
            <Ticket className="size-7" aria-hidden />
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold text-balance md:text-5xl">
            {t("welcomeTitle", { app: tc("appName") })}
          </h1>
          <p className="mt-2 text-muted-foreground md:text-lg">{t("subtitle")}</p>
          <ul className="mt-6 hidden space-y-3 lg:block">
            {(["benefit1", "benefit2", "benefit3"] as const).map((key) => (
              <li key={key} className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-highlight/30 text-primary">
                  <Check className="size-4" aria-hidden />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm md:p-8 lg:mx-0 lg:ml-auto"
        >
          <div role="tablist" className="mb-6 flex rounded-lg bg-muted p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  "relative flex-1 rounded-md py-2 text-sm font-bold transition-colors",
                  mode === m ? "text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {mode === m && (
                  <motion.span
                    layoutId="auth-tab"
                    className="absolute inset-0 rounded-md bg-primary"
                  />
                )}
                <span className="relative">
                  {t(m === "login" ? "logIn" : "signUp")}
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "login" ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {mode === "login" ? <LoginForm /> : <SignupForm />}
            </motion.div>
          </AnimatePresence>

          <div className="my-5 flex items-center gap-3 text-[13px] text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
            {t("or")}
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {(["google", "facebook"] as const).map((p) => (
              <Button
                key={p}
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => showToast(t("comingSoon"))}
              >
                {t(p)}
              </Button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/** Password field with a show/hide toggle. */
function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const t = useTranslations("auth");
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className="pr-10" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={t(visible ? "hidePassword" : "showPassword")}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        )}
      </button>
    </div>
  );
}

function useAuthSuccess() {
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const showToast = useToastStore((s) => s.show);

  return (user: { name: string; identifier: string }, created = false) => {
    login(user);
    showToast(t(created ? "created" : "welcome"));
    router.replace(safeNext(params.get("next")));
  };
}

function LoginForm() {
  const t = useTranslations("auth");
  const onSuccess = useAuthSuccess();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(({ identifier }) =>
        onSuccess({ name: identifier.split("@")[0], identifier }),
      )}
      className="space-y-3.5"
    >
      <div>
        <Label htmlFor="identifier" className="mb-1.5">
          {t("identifier")}
        </Label>
        <Input
          id="identifier"
          autoComplete="username"
          placeholder={t("identifierPlaceholder")}
          aria-invalid={!!errors.identifier}
          {...register("identifier")}
        />
        <FieldError message={errors.identifier?.message} />
      </div>
      <div>
        <Label htmlFor="password" className="mb-1.5">
          {t("password")}
        </Label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          placeholder={t("passwordPlaceholder")}
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />
      </div>
      <Button type="submit" className="h-12 w-full text-[15px]">
        {t("logIn")}
      </Button>
    </form>
  );
}

function SignupForm() {
  const t = useTranslations("auth");
  const onSuccess = useAuthSuccess();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(({ name, identifier }) =>
        onSuccess({ name, identifier }, true),
      )}
      className="space-y-3.5"
    >
      <div>
        <Label htmlFor="name" className="mb-1.5">
          {t("name")}
        </Label>
        <Input
          id="name"
          autoComplete="name"
          placeholder={t("namePlaceholder")}
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </div>
      <div>
        <Label htmlFor="signup-identifier" className="mb-1.5">
          {t("identifier")}
        </Label>
        <Input
          id="signup-identifier"
          autoComplete="username"
          placeholder={t("identifierPlaceholder")}
          aria-invalid={!!errors.identifier}
          {...register("identifier")}
        />
        <FieldError message={errors.identifier?.message} />
      </div>
      <div>
        <Label htmlFor="signup-password" className="mb-1.5">
          {t("password")}
        </Label>
        <PasswordInput
          id="signup-password"
          autoComplete="new-password"
          placeholder={t("passwordPlaceholder")}
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />
      </div>
      <div>
        <Label htmlFor="confirmPassword" className="mb-1.5">
          {t("confirmPassword")}
        </Label>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
        <FieldError message={errors.confirmPassword?.message} />
      </div>
      <Button type="submit" className="h-12 w-full text-[15px]">
        {t("signUp")}
      </Button>
    </form>
  );
}
