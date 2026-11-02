"use client";

import { useEffect } from "react";
import useAuthStore from "@/store/useAuthStore";
import useCartStore from "@/store/useCartStore";
import useOrderStore from "@/store/useOrderStore";
import useThemeStore from "@/store/useThemeStore";

/**
 * Persisted stores use `skipHydration` so the first client render matches the
 * server HTML; they load from localStorage here, after hydration.
 */
export default function StoreHydrator() {
  useEffect(() => {
    useCartStore.persist.rehydrate();
    useThemeStore.persist.rehydrate();
    useAuthStore.persist.rehydrate();
    useOrderStore.persist.rehydrate();
  }, []);
  return null;
}
