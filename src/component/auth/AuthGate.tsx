"use client";

import { useEffect } from "react";
import { useHydrated } from "@/hook/useHydrated";
import { usePathname, useRouter } from "@/i18n/navigation";
import useAuthStore from "@/store/useAuthStore";

/** Single place where session-only routes are protected. */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated(useAuthStore.persist);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (hydrated && !user) {
      router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, user, router, pathname]);

  if (!hydrated || !user) return null;
  return <>{children}</>;
}
