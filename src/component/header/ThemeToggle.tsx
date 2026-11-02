"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { iconButton } from "@/lib/styles";
import useThemeStore from "@/store/useThemeStore";

export default function ThemeToggle() {
  const t = useTranslations("header");
  const setTheme = useThemeStore((s) => s.setTheme);

  const toggle = () => {
    const next = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("toggleTheme")}
      className={iconButton}
    >
      <Moon className="size-[18px] dark:hidden" aria-hidden />
      <Sun className="hidden size-[18px] dark:block" aria-hidden />
    </button>
  );
}
