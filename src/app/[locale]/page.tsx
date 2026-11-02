import { getTranslations, setRequestLocale } from "next-intl/server";
import Container from "@/component/ui/Container";
import HeroBanner from "@/component/ticket/HeroBanner";
import TicketBrowser from "@/component/ticket/TicketBrowser";
import { formatDrawDate } from "@/lib/lottery";
import {
  getFirstPrize,
  getLatestDraw,
  getTickets,
} from "@/lib/lottery-data";
import { buildMetadata, SITE_URL } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.home" });
  return buildMetadata({
    locale,
    title: t("title"),
    description: t("description"),
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const draw = getLatestDraw();
  const first = getFirstPrize(draw);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Myanmar Lottery",
    url: `${SITE_URL}/${locale}`,
    inLanguage: locale,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroBanner
        date={formatDrawDate(draw.date, locale)}
        prize={first?.amount ?? 0}
      />
      <Container>
        <TicketBrowser tickets={getTickets()} />
      </Container>
    </>
  );
}
