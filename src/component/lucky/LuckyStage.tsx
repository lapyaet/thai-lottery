"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import LuckyResult from "@/component/lucky/LuckyResult";
import LuckyScene, { type Phase } from "@/component/lucky/LuckyScene";
import { Button } from "@/components/ui/button";
import { generateLuckyTicket } from "@/lib/lucky";
import { tap } from "@/lib/motion";
import type { Ticket } from "@/types/lottery.type";

const NEXT: Partial<Record<Phase, Phase>> = {
  walking: "shaking",
  shaking: "dropping",
  dropping: "opening",
  opening: "done",
  returning: "idle",
};
/** Safety nets in case the scene never reports that a phase has finished. */
const FALLBACK_MS: Partial<Record<Phase, number>> = {
  walking: 25000,
  shaking: 20000,
  dropping: 30000,
  opening: 20000,
  returning: 25000,
};

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

/** Loaded client-only (see LuckyLoader), so browser APIs are safe in initializers. */
export default function LuckyStage({ drawDate }: { drawDate: string }) {
  const t = useTranslations("lucky");
  const reduced = useReducedMotion();
  const [webgl] = useState(hasWebGL);
  const night = useNight();
  // Dragging to orbit would hijack touch scrolling, so only offer it with a mouse.
  const [interactive] = useState(
    () => window.matchMedia("(pointer: fine)").matches,
  );
  const [phase, setPhase] = useState<Phase>("idle");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const busy = phase !== "idle" && phase !== "done";
  const skipAnimation = !!reduced || !webgl;

  const generate = () => {
    if (busy) return;
    setTicket(generateLuckyTicket(drawDate));
    setPhase(skipAnimation ? "done" : "walking");
  };

  // Another ticket: the boy is already at the tree, so he just shakes it again
  // and a different envelope comes loose.
  const again = () => {
    setResetKey((k) => k + 1);
    setTicket(generateLuckyTicket(drawDate));
    setPhase(skipAnimation ? "done" : "shaking");
  };

  // Close the ticket: the boy walks back home through the door.
  const close = useCallback(() => {
    setResetKey((k) => k + 1);
    setPhase(skipAnimation ? "idle" : "returning");
  }, [skipAnimation]);

  const onPhaseEnd = useCallback((ended: Phase) => {
    setPhase((cur) => (cur === ended ? (NEXT[ended] ?? cur) : cur));
  }, []);

  useEffect(() => {
    const ms = FALLBACK_MS[phase];
    if (!ms) return;
    const timer = setTimeout(
      () => setPhase((cur) => (cur === phase ? (NEXT[phase] ?? cur) : cur)),
      ms,
    );
    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <section className="relative h-[calc(100dvh-var(--header-h))] min-h-[480px] w-full overflow-hidden bg-[#b9d8ee] dark:bg-[#0a1226]">
      {webgl ? (
        <div aria-hidden className="absolute inset-0">
          <LuckyScene
            phase={phase}
            night={night}
            resetKey={resetKey}
            onPhaseEnd={onPhaseEnd}
            interactive={interactive}
          />
        </div>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-sky-300 to-green-200 text-[12rem]"
        >
          🌳
        </div>
      )}

      {/* Title chip (the real heading lives on the page for SEO). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-3 md:p-5"
      >
        <div className="rounded-2xl bg-card/75 px-5 py-3 text-center shadow-lg backdrop-blur-md">
          <p className="font-display text-xl font-extrabold md:text-3xl">
            {t("title")}
          </p>
          <p className="text-xs text-muted-foreground md:text-sm">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* The one lucky ticket: centred on the screen over a soft scrim. */}
      <AnimatePresence>
        {phase === "done" && ticket && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/25 p-4 backdrop-blur-[2px]"
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div className="w-full max-w-md">
              <LuckyResult ticket={ticket} onAgain={again} onClose={close} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase !== "done" && (
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 p-4 pb-6 md:pb-8">
          {busy ? (
            <p
              key={phase}
              className="rounded-full bg-card/85 px-6 py-3 text-sm font-semibold shadow-xl backdrop-blur md:text-base"
            >
              {t(`status.${phase}`)}
            </p>
          ) : (
            <motion.div whileTap={tap}>
              <Button
                size="lg"
                className="h-14 rounded-full px-10 text-lg shadow-xl"
                onClick={generate}
              >
                🌳 {t("generate")}
              </Button>
            </motion.div>
          )}
          {webgl && interactive && phase === "idle" && (
            <p className="rounded-full bg-card/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              {t("hint")}
            </p>
          )}
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {phase === "done" && ticket
          ? t("announce", { num: ticket.num })
          : busy
            ? t(`status.${phase}`)
            : ""}
      </p>
    </section>
  );
}
