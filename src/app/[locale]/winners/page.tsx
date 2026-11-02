import { getTranslations, setRequestLocale } from "next-intl/server";
import Container from "@/component/ui/Container";
import CheckTicketForm from "@/component/winner/CheckTicketForm";
import WinnerHero from "@/component/winner/WinnerHero";
import WinnerList from "@/component/winner/WinnerList";
import { formatDrawDate } from "@/lib/lottery";
import { getLatestDraw } from "@/lib/lottery-data";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.winners" });
  return buildMetadata({
    locale,
    path: "/winners",
    title: t("title"),
    description: t("description"),
  });
}

export default async function WinnersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const draw = getLatestDraw();

  return (
    <>
      <WinnerHero date={formatDrawDate(draw.date, locale)}>
        <CheckTicketForm draw={draw} />
      </WinnerHero>
      <Container>
        <WinnerList draw={draw} />
      </Container>
    </>
  );
}
