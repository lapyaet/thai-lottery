"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import useToastStore from "@/store/useToastStore";

export default function Toast() {
  const { message, id, hide } = useToastStore();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(hide, 2200);
    return () => clearTimeout(timer);
  }, [message, id, hide]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
      <AnimatePresence>
        {message && (
          <motion.output
            key={id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-lg"
          >
            {message}
          </motion.output>
        )}
      </AnimatePresence>
    </div>
  );
}
