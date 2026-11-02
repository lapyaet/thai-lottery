"use client";

import { useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import ChatComposer from "@/component/chat/ChatComposer";
import ChatLog from "@/component/chat/ChatLog";
import ChatScene from "@/component/chat/ChatScene";
import RobotBubble from "@/component/chat/RobotBubble";
import { deriveMode, type RobotMode } from "@/lib/robot";
import useChatStore from "@/store/useChatStore";

/** True while the app is in dark mode (the `dark` class on <html>). */
function useNight() {
  return useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      return () => observer.disconnect();
    },
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
}

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

const TYPING_MS = 1500;
const NOD_MS = 700;
const WAVE_MS = 2200;

/** Loaded client-only (see ChatLoader), so browser APIs are safe in initializers. */
export default function ChatStage() {
  const t = useTranslations("chat");
  const reduced = !!useReducedMotion();
  const night = useNight();
  const [webgl] = useState(hasWebGL);
  const status = useChatStore((s) => s.status);
  const [typing, setTyping] = useState(false);
  const [transient, setTransient] = useState<RobotMode | null>("wave");

  // The scene reads this ref every frame, so the robot changes behaviour without re-rendering.
  const mode = useRef<RobotMode>("wave");
  useEffect(() => {
    mode.current = deriveMode(status, typing, transient);
  }, [status, typing, transient]);

  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const stopTyping = useCallback(() => {
    clearTimeout(typingTimer.current);
    setTyping(false);
  }, []);
  const onTyping = useCallback(() => {
    setTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), TYPING_MS);
  }, []);
  // Nod when a message is sent; wave when the chat is cleared (and once on arrival).
  const onSend = useCallback(() => {
    stopTyping();
    setTransient("sending");
  }, [stopTyping]);
  const onClear = useCallback(() => {
    stopTyping();
    setTransient("wave");
  }, [stopTyping]);

  useEffect(() => {
    if (!transient) return;
    const timer = setTimeout(
      () => setTransient(null),
      transient === "wave" ? WAVE_MS : NOD_MS,
    );
    return () => clearTimeout(timer);
  }, [transient]);

  useEffect(() => () => clearTimeout(typingTimer.current), []);

  return (
    <section className="relative flex h-[calc(100dvh-var(--header-h))] min-h-[560px] w-full flex-col overflow-hidden lg:block bg-gradient-to-b from-[#cfe3ff] to-[#f1e8ff] dark:from-[#070b1d] dark:to-[#242a63]">
      <div className="relative min-h-0 flex-[0_0_38%] lg:absolute lg:inset-0">
        {webgl ? (
          <div aria-hidden className="absolute inset-0">
            <ChatScene mode={mode} night={night} reduced={reduced} />
          </div>
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center"
          >
            <span className="text-8xl">🤖</span>
            <span className="text-sm text-muted-foreground">
              {t("noWebgl")}
            </span>
          </div>
        )}
        {/* Title chip (the real heading lives on the page for SEO). */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-3 md:p-5"
        >
          <div className="rounded-2xl bg-card/75 px-5 py-2 text-center shadow-lg backdrop-blur-md md:py-3">
            <p className="font-display text-lg font-extrabold md:text-3xl">
              {t("title")}
            </p>
            <p className="hidden text-xs text-muted-foreground sm:block md:text-sm">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </div>

      <RobotBubble />

      <div className="z-10 shrink-0 p-3 lg:absolute lg:bottom-6 lg:left-1/2 lg:w-[min(560px,calc(100%-3rem))] lg:-translate-x-1/2 lg:p-0">
        <ChatComposer onTyping={onTyping} onSend={onSend} onClear={onClear} />
      </div>
      <ChatLog />
    </section>
  );
}
