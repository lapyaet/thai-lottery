import { getTranslations, setRequestLocale } from "next-intl/server";
import PrizeTabs from "@/component/result/PrizeTabs";
import ResultHero from "@/component/result/ResultHero";
import Container from "@/component/ui/Container";
import { formatDrawDate } from "@/lib/lottery";
import { getFirstPrize, getLatestDraw } from "@/lib/lottery-data";
import { buildMetadata, localizedUrl } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.results" });
  return buildMetadata({
    locale,
    path: "/results",
    title: t("title"),
    description: t("description"),
  });
}

export default async function ResultsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const draw = getLatestDraw();
  const first = getFirstPrize(draw);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("meta.results.title"),
    description: t("meta.results.description"),
    url: localizedUrl(locale, "/results"),
    datePublished: draw.date,
    inLanguage: locale,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ResultHero
        date={formatDrawDate(draw.date, locale)}
        number={first?.number ?? ""}
        amount={first?.amount ?? 0}
      />
      <Container>
        <PrizeTabs groups={draw.groups} />
        <p className="px-4 pb-10 text-center text-xs text-muted-foreground">
          {t("results.footer")}
        </p>
      </Container>
    </>
  );
}
