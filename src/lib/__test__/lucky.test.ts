import { mulberry32 } from "@/lib/tree";
import { generateLuckyTicket } from "@/lib/lucky";

describe("generateLuckyTicket", () => {
  it("builds a 6-digit ticket with serial, price and draw date", () => {
    const t = generateLuckyTicket("2025-11-01");
    expect(t.num).toMatch(/^\d{6}$/);
    expect(t.serial).toMatch(/^[1-9][A-Z]\d{6}$/);
    expect(t.price).toBe(500);
    expect(t.drawDate).toBe("2025-11-01");
  });

  it("is deterministic for a given rng and varies otherwise", () => {
    const a = generateLuckyTicket("d", mulberry32(1));
    const b = generateLuckyTicket("d", mulberry32(1));
    const c = generateLuckyTicket("d", mulberry32(2));
    expect(a).toEqual(b);
    expect(a.num).not.toBe(c.num);
  });

  it("can produce leading zeros", () => {
    const t = generateLuckyTicket("d", () => 0);
    expect(t.num).toBe("000000");
  });
});
