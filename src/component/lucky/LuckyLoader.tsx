"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// three.js is large and needs WebGL: load it only on this route, client-side.
const LuckyStage = dynamic(() => import("@/component/lucky/LuckyStage"), {
  ssr: false,
  loading: () => (
    <Skeleton className="h-[calc(100dvh-var(--header-h))] min-h-[480px] w-full rounded-none bg-gradient-to-b from-sky-300 to-[#cfe0ea]" />
  ),
});

export default function LuckyLoader({ drawDate }: { drawDate: string }) {
  return <LuckyStage drawDate={drawDate} />;
}
