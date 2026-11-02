import type { Ticket } from "@/types/lottery.type";
import { TICKET_DIGITS } from "@/lib/lottery";

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

/** A random lucky ticket. `rng` is injectable for tests. */
export function generateLuckyTicket(
  drawDate: string,
  rng: () => number = Math.random,
): Ticket {
  const digit = () => Math.floor(rng() * 10);
  const num = Array.from({ length: TICKET_DIGITS }, digit).join("");
  const serial = `${1 + Math.floor(rng() * 9)}${LETTERS[Math.floor(rng() * LETTERS.length)]}${Array.from(
    { length: 6 },
    digit,
  ).join("")}`;

  return { num, price: 500, serial, drawDate };
}
