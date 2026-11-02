import { create } from "zustand";
import type { TicketFilter, TicketSort } from "@/types/lottery.type";

type FilterState = {
  search: string;
  categories: TicketFilter[];
  isRecommended: boolean;
  sortBy: TicketSort | null;
  setSearch: (search: string) => void;
  toggleCategory: (category: TicketFilter) => void;
  setIsRecommended: (isRecommended: boolean) => void;
  setSortBy: (sortBy: TicketSort | null) => void;
  reset: () => void;
};

const initial = {
  search: "",
  categories: [] as TicketFilter[],
  isRecommended: false,
  sortBy: null as TicketSort | null,
};

// Session-only: search criteria reset on reload.
const useFilterStore = create<FilterState>()((set) => ({
  ...initial,
  setSearch: (search) => set({ search }),
  toggleCategory: (category) =>
    set((s) => ({
      categories: s.categories.includes(category)
        ? s.categories.filter((c) => c !== category)
        : [...s.categories, category],
    })),
  setIsRecommended: (isRecommended) => set({ isRecommended }),
  setSortBy: (sortBy) => set({ sortBy }),
  reset: () => set(initial),
}));

export default useFilterStore;
