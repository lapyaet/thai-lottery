import type { Draw, Ticket } from "@/types/lottery.type";

/**
 * The single data seam for lottery content. Everything is mock data today;
 * swap these functions for API calls without touching components.
 */

const DRAW_DATE = "2025-11-01";

const NUMBERS = [
  "274916",
  "159237",
  "888888",
  "111111",
  "500000",
  "123456",
  "200005",
  "777777",
  "369369",
  "199990",
  "300030",
  "654321",
  "420420",
  "999999",
  "010305",
  "800000",
  "246810",
  "135790",
];

const TICKETS: Ticket[] = NUMBERS.map((num, i) => ({
  num,
  price: 500,
  serial: `${(i % 9) + 1}${String.fromCharCode(65 + (i % 17))}${String(
    123456 + i * 777,
  ).slice(-6)}`,
  drawDate: DRAW_DATE,
}));

const LATEST_DRAW: Draw = {
  date: DRAW_DATE,
  groups: [
    { tier: "first", numbers: ["274916"], amount: 1_000_000 },
    { tier: "neighbor", numbers: ["274915", "274917"], amount: 100_000 },
    {
      tier: "second",
      numbers: ["183462", "294710", "518293"],
      amount: 200_000,
    },
    {
      tier: "third",
      numbers: ["014529", "287451", "391847", "482093", "573016"],
      amount: 80_000,
    },
    { tier: "front3", numbers: ["274", "916"], amount: 80_000 },
    { tier: "last3", numbers: ["916", "274"], amount: 80_000 },
    { tier: "last2", numbers: ["16"], amount: 40_000 },
  ],
};

export function getTickets(): Ticket[] {
  return TICKETS;
}

export function getLatestDraw(): Draw {
  return LATEST_DRAW;
}

export function getFirstPrize(draw: Draw = LATEST_DRAW) {
  const group = draw.groups.find((g) => g.tier === "first");
  return group ? { number: group.numbers[0], amount: group.amount } : undefined;
}
