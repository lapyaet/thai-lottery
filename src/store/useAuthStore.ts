import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/lottery.type";

type AuthState = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
};

// Mock session: swap `login` for a real auth call without changing consumers.
const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: "session", skipHydration: true },
  ),
);

export default useAuthStore;
