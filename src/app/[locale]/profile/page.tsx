import Container from "@/component/ui/Container";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AuthGate from "@/component/auth/AuthGate";
import ProfileView from "@/component/profile/ProfileView";
import { getLatestDraw } from "@/lib/lottery-data";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.profile" });
  return buildMetadata({
    locale,
    path: "/profile",
    title: t("title"),
    description: t("description"),
    noindex: true,
  });
}

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Container size="narrow">
      <AuthGate>
        <ProfileView draw={getLatestDraw()} />
      </AuthGate>
    </Container>
  );
}
