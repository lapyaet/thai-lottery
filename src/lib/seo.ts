import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://myanmar-lottery.example.com";

const OG_LOCALE: Record<string, string> = { en: "en_US", my: "my_MM" };

type BuildMetadataInput = {
  locale: string;
  /** Path without locale prefix, e.g. "/results" ("" for home). */
  path?: string;
  title: string;
  description: string;
  /** Private/transactional pages should not be indexed. */
  noindex?: boolean;
};

export function localizedUrl(locale: string, path = ""): string {
  return `${SITE_URL}/${locale}${path}`;
}

export function buildMetadata({
  locale,
  path = "",
  title,
  description,
  noindex = false,
}: BuildMetadataInput): Metadata {
  const url = localizedUrl(locale, path);
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, localizedUrl(l, path)]),
  );

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Myanmar Lottery",
      locale: OG_LOCALE[locale] ?? OG_LOCALE.en,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
