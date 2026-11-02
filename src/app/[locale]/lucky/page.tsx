import { getTranslations, setRequestLocale } from "next-intl/server";
import LuckyLoader from "@/component/lucky/LuckyLoader";
import { getLatestDraw } from "@/lib/lottery-data";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.lucky" });
  return buildMetadata({
    locale,
    path: "/lucky",
    title: t("title"),
    description: t("description"),
  });
}

export default async function LuckyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "lucky" });

  return (
    <>
      {/* Real heading and description for SEO/assistive tech; the stage shows them visually. */}
      <h1 className="sr-only">{t("title")}</h1>
      <p className="sr-only">{t("subtitle")}</p>
      <LuckyLoader drawDate={getLatestDraw().date} />
    </>
  );
}
