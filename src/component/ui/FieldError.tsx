"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

/** Shows a zod message key (from `src/lib/schemas.ts`) as translated copy. */
export default function FieldError({
  message,
  id,
}: {
  message?: string;
  id?: string;
}) {
  const t = useTranslations("errors");

  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p
          id={id}
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="mt-1.5 text-xs font-medium text-destructive"
        >
          {t(message)}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
