import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AuthForm from "@/component/auth/AuthForm";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.auth" });
  return buildMetadata({
    locale,
    path: "/auth",
    title: t("title"),
    description: t("description"),
    noindex: true,
  });
}

export default async function AuthPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
