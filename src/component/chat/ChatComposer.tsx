"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Send, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fadeUp, staggerContainer, tap } from "@/lib/motion";
import useChatStore from "@/store/useChatStore";

const SUGGESTIONS = ["draw", "buy", "prize"] as const;

/** Where the user talks to the robot. Answers are not shown here; the robot's bubble shows them. */
export default function ChatComposer({
  onTyping,
  onSend,
  onClear,
}: {
  /** Fired while the user types, so the robot can turn and listen. */
  onTyping?: () => void;
  /** Fired when a message is sent, so the robot can nod. */
  onSend?: () => void;
  /** Fired when the chat is cleared, so the robot can wave. */
  onClear?: () => void;
}) {
  const t = useTranslations("chat");
  const locale = useLocale();
  const reduced = useReducedMotion();
  const hasMessages = useChatStore((s) => s.messages.length > 0);
  const status = useChatStore((s) => s.status);
  const send = useChatStore((s) => s.send);
  const clear = useChatStore((s) => s.clear);
  const [draft, setDraft] = useState("");

  const busy = status === "thinking" || status === "talking";

  const submit = (text: string) => {
    if (!text.trim() || busy) return;
    setDraft("");
    onSend?.();
    void send(text, { locale, instant: !!reduced });
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <AnimatePresence>
        {!hasMessages && (
          <motion.div
            key="chips"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, height: 0 }}
            role="group"
            aria-label={t("suggestionsLabel")}
            className="flex flex-wrap justify-center gap-2"
          >
            {SUGGESTIONS.map((key) => (
              <motion.button
                key={key}
                type="button"
                variants={fadeUp}
                whileTap={tap}
                onClick={() => submit(t(`suggestions.${key}`))}
                className="rounded-full border bg-card/85 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-md transition-colors hover:bg-accent"
              >
                {t(`suggestions.${key}`)}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <form
        className="flex w-full items-center gap-1.5 rounded-full border bg-card/85 p-1.5 pl-4 shadow-xl backdrop-blur-md focus-within:ring-3 focus-within:ring-ring/40"
        onSubmit={(e) => {
          e.preventDefault();
          submit(draft);
        }}
      >
        <Input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            onTyping?.();
          }}
          placeholder={t("placeholder")}
          aria-label={t("inputLabel")}
          autoComplete="off"
          className="h-9 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={t("clear")}
          title={t("clear")}
          disabled={!hasMessages}
          onClick={() => {
            clear();
            onClear?.();
          }}
        >
          <Trash2 aria-hidden />
        </Button>
        <Button
          type="submit"
          size="icon-lg"
          className="rounded-full"
          disabled={busy || !draft.trim()}
          aria-label={t("send")}
        >
          <Send aria-hidden />
        </Button>
      </form>
    </div>
  );
}
