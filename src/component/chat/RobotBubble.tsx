"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import useChatStore from "@/store/useChatStore";

/**
 * The one place the AI's answer is shown, as the robot's speech bubble.
 * Beside the robot's head on large screens; under the robot on small ones.
 */
export default function RobotBubble() {
  const t = useTranslations("chat");
  const locale = useLocale();
  const reduced = useReducedMotion();
  const status = useChatStore((s) => s.status);
  const messages = useChatStore((s) => s.messages);
  const retry = useChatStore((s) => s.retry);
  const wrapper = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLParagraphElement>(null);

  const last = messages[messages.length - 1];
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const reply = last?.role === "bot" ? last : undefined;

  let key: string;
  let text: string | null = null;
  if (status === "thinking") key = "thinking";
  else if (status === "error") {
    key = "error";
    text = t("error");
  } else if (reply) {
    key = reply.id;
    text = reply.text;
  } else if (last) {
    key = "waiting";
  } else {
    key = "greeting";
    text = t("greeting");
  }

  // Follow the text while a long reply streams in.
  useEffect(() => {
    for (const el of [body.current, wrapper.current]) {
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [text]);

  return (
    <div
      ref={wrapper}
      className="relative z-10 mx-3 mt-4 min-h-0 flex-1 overflow-y-auto lg:pointer-events-none lg:absolute lg:top-[24%] lg:left-1/2 lg:mx-0 lg:mt-0 lg:ml-[105px] lg:w-[min(340px,calc(50%-120px))] lg:flex-none lg:overflow-visible"
    >
      {lastUser && key !== "greeting" && (
        <p className="mb-1.5 truncate px-2 text-xs text-muted-foreground lg:rounded-full lg:bg-card/70 lg:py-1 lg:backdrop-blur-sm">
          <span className="font-semibold">{t("you")}:</span> {lastUser.text}
        </p>
      )}
      <AnimatePresence mode="wait">
        {key !== "waiting" && (
          <motion.div
            key={key}
            initial={reduced ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="pointer-events-auto relative origin-top rounded-2xl bg-card px-4 py-3 text-sm leading-relaxed shadow-xl ring-1 ring-border lg:origin-left lg:text-base"
          >
            {/* tail pointing at the robot: up on small screens, left on large */}
            <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 rounded-sm bg-card ring-1 ring-border lg:top-6 lg:-left-1.5 lg:translate-x-0" />
            <span className="absolute inset-0 rounded-2xl bg-card" aria-hidden />
            <div className="relative">
              {text === null ? (
                <span className="flex items-center gap-1 py-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="size-2 rounded-full bg-muted-foreground"
                      animate={
                        reduced
                          ? undefined
                          : { y: [0, -5, 0], opacity: [0.4, 1, 0.4] }
                      }
                      transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </span>
              ) : (
                <p
                  ref={body}
                  className="whitespace-pre-wrap break-words lg:max-h-[38dvh] lg:overflow-y-auto"
                >
                  {text}
                </p>
              )}
              {status === "error" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => void retry({ locale, instant: !!reduced })}
                >
                  <RotateCcw aria-hidden />
                  {t("retry")}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
