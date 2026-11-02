import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order } from "@/types/lottery.type";

type OrderState = {
  orders: Order[];
  add: (order: Order) => void;
};

const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      orders: [],
      add: (order) => set((s) => ({ orders: [order, ...s.orders] })),
    }),
    { name: "orders", skipHydration: true },
  ),
);

export default useOrderStore;
