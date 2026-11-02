"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function EmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-3 px-4 py-16 text-center"
    >
      <div className="text-5xl opacity-40" aria-hidden>
        {icon}
      </div>
      <h2 className="font-display text-lg font-bold text-muted-foreground">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {actionHref && actionLabel && (
        <Link href={actionHref} className={cn(buttonVariants({ size: "lg" }), "mt-2")}>
          {actionLabel}
        </Link>
      )}
    </motion.div>
  );
}
