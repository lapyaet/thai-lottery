import useCartStore from "@/store/useCartStore";
import type { Ticket } from "@/types/lottery.type";

const a: Ticket = { num: "111111", price: 500, serial: "1A", drawDate: "2025-11-01" };
const b: Ticket = { num: "222222", price: 700, serial: "2B", drawDate: "2025-11-01" };

beforeEach(() => useCartStore.setState({ items: [] }));

describe("useCartStore", () => {
  it("adds without duplicating", () => {
    useCartStore.getState().add(a);
    useCartStore.getState().add(a);
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it("toggles and reports whether it added", () => {
    expect(useCartStore.getState().toggle(a)).toBe(true);
    expect(useCartStore.getState().has("111111")).toBe(true);
    expect(useCartStore.getState().toggle(a)).toBe(false);
    expect(useCartStore.getState().has("111111")).toBe(false);
  });

  it("removes, totals and clears", () => {
    useCartStore.getState().add(a);
    useCartStore.getState().add(b);
    expect(useCartStore.getState().total()).toBe(1200);
    useCartStore.getState().remove("111111");
    expect(useCartStore.getState().items.map((t) => t.num)).toEqual(["222222"]);
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toEqual([]);
  });
});
