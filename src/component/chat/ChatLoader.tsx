"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// three.js is large and needs WebGL: load it only on this route, client-side.
const ChatStage = dynamic(() => import("@/component/chat/ChatStage"), {
  ssr: false,
  loading: () => (
    <Skeleton className="h-[calc(100dvh-var(--header-h))] min-h-[480px] w-full rounded-none bg-gradient-to-b from-sky-200 to-indigo-200 dark:from-slate-900 dark:to-indigo-950" />
  ),
});

export default function ChatLoader() {
  return <ChatStage />;
}
