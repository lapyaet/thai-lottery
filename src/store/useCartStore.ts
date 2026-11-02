import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cartTotal } from "@/lib/lottery";
import type { Ticket } from "@/types/lottery.type";

type CartState = {
  items: Ticket[];
  add: (ticket: Ticket) => void;
  remove: (num: string) => void;
  /** Adds if absent, removes if present. Returns true when added. */
  toggle: (ticket: Ticket) => boolean;
  clear: () => void;
  has: (num: string) => boolean;
  total: () => number;
};

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (ticket) =>
        set((s) =>
          s.items.some((t) => t.num === ticket.num)
            ? s
            : { items: [...s.items, ticket] },
        ),
      remove: (num) =>
        set((s) => ({ items: s.items.filter((t) => t.num !== num) })),
      toggle: (ticket) => {
        const exists = get().has(ticket.num);
        if (exists) get().remove(ticket.num);
        else get().add(ticket);
        return !exists;
      },
      clear: () => set({ items: [] }),
      has: (num) => get().items.some((t) => t.num === num),
      total: () => cartTotal(get().items),
    }),
    { name: "cart", skipHydration: true, partialize: (s) => ({ items: s.items }) },
  ),
);

export default useCartStore;
