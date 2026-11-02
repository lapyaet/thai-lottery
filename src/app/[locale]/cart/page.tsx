import { getTranslations, setRequestLocale } from "next-intl/server";
import CartList from "@/component/cart/CartList";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.cart" });
  return buildMetadata({
    locale,
    path: "/cart",
    title: t("title"),
    description: t("description"),
    noindex: true,
  });
}

export default async function CartPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CartList />;
}
