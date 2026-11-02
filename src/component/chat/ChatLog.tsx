"use client";

import { useTranslations } from "next-intl";
import useChatStore from "@/store/useChatStore";

/** Screen-reader copy of the conversation; the robot's bubble is the visible answer. */
export default function ChatLog() {
  const t = useTranslations("chat");
  const messages = useChatStore((s) => s.messages);
  return (
    <ul role="log" aria-live="polite" aria-label={t("title")} className="sr-only">
      {messages.map((m) => (
        <li key={m.id}>
          {m.role === "user" ? t("you") : t("bot")}: {m.text}
        </li>
      ))}
    </ul>
  );
}
