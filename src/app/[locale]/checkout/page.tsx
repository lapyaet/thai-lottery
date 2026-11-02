import Container from "@/component/ui/Container";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AuthGate from "@/component/auth/AuthGate";
import CheckoutForm from "@/component/checkout/CheckoutForm";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.checkout" });
  return buildMetadata({
    locale,
    path: "/checkout",
    title: t("title"),
    description: t("description"),
    noindex: true,
  });
}

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Container size="narrow">
      <AuthGate>
        <CheckoutForm />
      </AuthGate>
    </Container>
  );
}
