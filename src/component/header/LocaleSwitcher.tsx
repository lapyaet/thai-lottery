"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { iconButton } from "@/lib/styles";

export default function LocaleSwitcher() {
  const t = useTranslations("header");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const next = locale === "en" ? "my" : "en";

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: next })}
      aria-label={t("language")}
      className={`${iconButton} min-w-9 px-2 font-display text-xs font-bold`}
    >
      {next === "my" ? "မြန်" : "EN"}
    </button>
  );
}
