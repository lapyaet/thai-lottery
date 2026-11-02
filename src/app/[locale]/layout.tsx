import type { Metadata } from "next";
import { Noto_Sans_Myanmar, Padauk, Poppins } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import Header from "@/component/header/Header";
import StoreHydrator from "@/component/provider/StoreHydrator";
import ThemeScript from "@/component/provider/ThemeScript";
import Toast from "@/component/ui/Toast";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo";
import "../globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});
const padauk = Padauk({
  variable: "--font-padauk",
  subsets: ["latin", "myanmar"],
  weight: ["400", "700"],
});
const notoMyanmar = Noto_Sans_Myanmar({
  variable: "--font-noto-myanmar",
  subsets: ["myanmar"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${poppins.variable} ${padauk.variable} ${notoMyanmar.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <StoreHydrator />
          <Header />
          <main className="w-full flex-1">
            {children}
          </main>

          <Toast />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
