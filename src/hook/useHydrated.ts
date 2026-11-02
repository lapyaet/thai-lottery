"use client";

import { useSyncExternalStore } from "react";

type PersistApi = {
  hasHydrated: () => boolean;
  onFinishHydration: (fn: () => void) => () => void;
};

/** True once a `skipHydration` persisted store has loaded from storage. */
export function useHydrated(persist: PersistApi): boolean {
  return useSyncExternalStore(
    (cb) => persist.onFinishHydration(cb),
    () => persist.hasHydrated(),
    () => false,
  );
}
