export type Ticket = {
  num: string;
  price: number;
  serial: string;
  /** ISO date (YYYY-MM-DD) of the draw this ticket plays in. */
  drawDate: string;
};

/** A number category a ticket can belong to (multi-select filter). */
export type TicketFilter =
  | "end0"
  | "end5"
  | "repeat"
  | "sequence"
  | "lucky";

export type TicketSort = "lowToHigh" | "highToLow";

export type PrizeTier =
  | "first"
  | "neighbor"
  | "second"
  | "third"
  | "front3"
  | "last3"
  | "last2";

export type PrizeGroup = {
  tier: PrizeTier;
  numbers: string[];
  /** Prize per winning number, in kyat. */
  amount: number;
};

export type Draw = {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  groups: PrizeGroup[];
};

export type CheckResult = {
  won: boolean;
  tier?: PrizeTier;
  amount?: number;
};

export type PaymentMethod = "qr" | "bank" | "card";

export type Order = {
  id: string;
  createdAt: string;
  tickets: Ticket[];
  total: number;
  paymentMethod: PaymentMethod;
};

export type User = {
  name: string;
  identifier: string;
};
