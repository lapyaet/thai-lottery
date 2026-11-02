import { getTranslations, setRequestLocale } from "next-intl/server";
import ChatLoader from "@/component/chat/ChatLoader";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.chat" });
  return buildMetadata({
    locale,
    path: "/chat",
    title: t("title"),
    description: t("description"),
  });
}

export default async function ChatPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "chat" });

  return (
    <>
      {/* Real heading and description for SEO/assistive tech; the stage shows them visually. */}
      <h1 className="sr-only">{t("title")}</h1>
      <p className="sr-only">{t("subtitle")}</p>
      <ChatLoader />
    </>
  );
}
