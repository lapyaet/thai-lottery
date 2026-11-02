import {
  cartTotal,
  checkTicket,
  computeProfileStats,
  createOrder,
  filterTickets,
  formatDrawDate,
  isRepeating,
} from "@/lib/lottery";
import { getLatestDraw, getTickets } from "@/lib/lottery-data";

const draw = getLatestDraw();
const tickets = getTickets();

const base = { search: "", categories: [], isRecommended: false, sortBy: null };

describe("filterTickets", () => {
  it("returns everything with no criteria", () => {
    expect(filterTickets(tickets, base)).toHaveLength(tickets.length);
  });

  it("searches by substring and trims whitespace", () => {
    const result = filterTickets(tickets, { ...base, search: " 2749 " });
    expect(result.map((t) => t.num)).toEqual(["274916"]);
  });

  it("filters numbers ending in 0 or 5", () => {
    const end0 = filterTickets(tickets, { ...base, categories: ["end0"] });
    const end5 = filterTickets(tickets, { ...base, categories: ["end5"] });
    expect(end0.every((t) => t.num.endsWith("0"))).toBe(true);
    expect(end5.every((t) => t.num.endsWith("5"))).toBe(true);
    expect(end0.length).toBeGreaterThan(0);
    expect(end5.length).toBeGreaterThan(0);
  });

  it("matches any of several selected categories", () => {
    const both = filterTickets(tickets, { ...base, categories: ["end0", "end5"] });
    expect(both.every((t) => /[05]$/.test(t.num))).toBe(true);
    expect(both.length).toBe(
      filterTickets(tickets, { ...base, categories: ["end0"] }).length +
        filterTickets(tickets, { ...base, categories: ["end5"] }).length,
    );
  });

  it("filters repeating, sequence and lucky numbers", () => {
    const repeat = filterTickets(tickets, { ...base, categories: ["repeat"] });
    expect(repeat.every((t) => isRepeating(t.num))).toBe(true);
    expect(
      filterTickets(tickets, { ...base, categories: ["sequence"] }).map((t) => t.num),
    ).toContain("123456");
    expect(
      filterTickets(tickets, { ...base, categories: ["lucky"] }).map((t) => t.num),
    ).toContain("888888");
  });

  it("recommended keeps only special-number tickets", () => {
    const result = filterTickets(tickets, { ...base, isRecommended: true });
    expect(result.map((t) => t.num)).toEqual(
      expect.arrayContaining(["888888", "123456", "111111"]),
    );
    expect(result.map((t) => t.num)).not.toContain("159237");
  });

  it("combines search and categories", () => {
    const result = filterTickets(tickets, { ...base, search: "8", categories: ["lucky"] });
    expect(result.map((t) => t.num)).toEqual(["888888"]);
  });

  it("sorts by number without mutating the input", () => {
    const before = tickets.map((t) => t.num);
    const asc = filterTickets(tickets, { ...base, sortBy: "lowToHigh" }).map((t) => Number(t.num));
    const desc = filterTickets(tickets, { ...base, sortBy: "highToLow" }).map((t) => Number(t.num));
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
    expect(tickets.map((t) => t.num)).toEqual(before);
  });
});

describe("checkTicket", () => {
  it("awards the first prize for an exact match", () => {
    expect(checkTicket("274916", draw)).toEqual({
      won: true,
      tier: "first",
      amount: 1_000_000,
    });
  });

  it("awards the best prize when several tiers match", () => {
    // 111916 only matches last 3 digits (80,000) and last 2 digits (40,000).
    expect(checkTicket("111916", draw)).toEqual({
      won: true,
      tier: "last3",
      amount: 80_000,
    });
  });

  it("matches neighbor and second prizes", () => {
    expect(checkTicket("274915", draw).tier).toBe("neighbor");
    expect(checkTicket("183462", draw).tier).toBe("second");
  });

  it("matches last 2 digits", () => {
    expect(checkTicket("000016", draw)).toEqual({
      won: true,
      tier: "last2",
      amount: 40_000,
    });
  });

  it("reports a loss when nothing matches", () => {
    expect(checkTicket("999999", draw)).toEqual({ won: false });
  });
});

describe("cart and orders", () => {
  it("totals ticket prices", () => {
    expect(cartTotal([{ price: 500 }, { price: 500 }, { price: 250 }])).toBe(1250);
    expect(cartTotal([])).toBe(0);
  });

  it("creates an order with the cart total", () => {
    const order = createOrder(tickets.slice(0, 2), "qr");
    expect(order.total).toBe(1000);
    expect(order.paymentMethod).toBe("qr");
    expect(order.tickets).toHaveLength(2);
    expect(order.id).toBeTruthy();
  });

  it("computes profile stats against a draw", () => {
    const won = tickets.find((t) => t.num === "274916");
    const lost = tickets.find((t) => t.num === "159237");
    if (!won || !lost) throw new Error("fixture tickets missing");
    const order = createOrder([won, lost], "bank");
    expect(computeProfileStats([order], draw)).toEqual({
      ticketsBought: 2,
      drawsWon: 1,
      totalWon: 1_000_000,
    });
  });
});

describe("formatDrawDate", () => {
  it("formats an ISO date in English", () => {
    expect(formatDrawDate("2025-11-01", "en")).toBe("1 November 2025");
  });
});
