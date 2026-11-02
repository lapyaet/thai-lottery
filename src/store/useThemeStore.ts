import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";

type ThemeState = {
  theme: Theme | null;
  setTheme: (theme: Theme) => void;
};

const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: null,
      setTheme: (theme) => set({ theme }),
    }),
    { name: "theme", skipHydration: true },
  ),
);

export default useThemeStore;
