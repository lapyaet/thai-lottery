import type {
  CheckResult,
  Draw,
  Order,
  PaymentMethod,
  PrizeGroup,
  PrizeTier,
  Ticket,
  TicketFilter,
  TicketSort,
} from "@/types/lottery.type";

export const TICKET_FILTERS: TicketFilter[] = [
  "end0",
  "end5",
  "repeat",
  "sequence",
  "lucky",
];

const SEQUENCE_NUMBERS = ["123456", "246810", "135790", "654321"];
/** "Recommended" tickets are the special-number categories. */
const RECOMMENDED_FILTERS: TicketFilter[] = ["repeat", "sequence", "lucky"];
const LUCKY_NUMBERS = ["888888", "777777", "999999", "111111"];

export const TICKET_DIGITS = 6;

export function isRepeating(num: string): boolean {
  return /^(\d)\1+$/.test(num);
}

export function matchesFilter(num: string, filter: TicketFilter): boolean {
  switch (filter) {
    case "end0":
      return num.endsWith("0");
    case "end5":
      return num.endsWith("5");
    case "repeat":
      return isRepeating(num);
    case "sequence":
      return SEQUENCE_NUMBERS.includes(num);
    case "lucky":
      return LUCKY_NUMBERS.includes(num);
  }
}

export type TicketQuery = {
  search: string;
  /** Selected categories; a ticket matches when it is in any of them. */
  categories: TicketFilter[];
  isRecommended: boolean;
  sortBy: TicketSort | null;
};

export function filterTickets(tickets: Ticket[], q: TicketQuery): Ticket[] {
  const query = q.search.trim();
  const result = tickets.filter(
    (t) =>
      (!query || t.num.includes(query)) &&
      (q.categories.length === 0 ||
        q.categories.some((c) => matchesFilter(t.num, c))) &&
      (!q.isRecommended ||
        RECOMMENDED_FILTERS.some((c) => matchesFilter(t.num, c))),
  );
  if (!q.sortBy) return result;
  const dir = q.sortBy === "lowToHigh" ? 1 : -1;
  return [...result].sort((a, b) => (Number(a.num) - Number(b.num)) * dir);
}

/** Which prize groups a ticket number wins from, as [group, matched] pairs. */
function winsGroup(num: string, group: PrizeGroup): boolean {
  switch (group.tier) {
    case "front3":
      return group.numbers.includes(num.slice(0, 3));
    case "last3":
      return group.numbers.includes(num.slice(-3));
    case "last2":
      return group.numbers.includes(num.slice(-2));
    default:
      return group.numbers.includes(num);
  }
}

/** The single best prize a ticket number wins in a draw. */
export function checkTicket(num: string, draw: Draw): CheckResult {
  let best: { tier: PrizeTier; amount: number } | undefined;
  for (const group of draw.groups) {
    if (winsGroup(num, group) && (!best || group.amount > best.amount)) {
      best = { tier: group.tier, amount: group.amount };
    }
  }
  return best ? { won: true, ...best } : { won: false };
}

export function cartTotal(tickets: Pick<Ticket, "price">[]): number {
  return tickets.reduce((sum, t) => sum + t.price, 0);
}

export function formatDrawDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "my" ? "my-MM" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

export function computeProfileStats(orders: Order[], draw: Draw) {
  let ticketsBought = 0;
  let drawsWon = 0;
  let totalWon = 0;
  for (const order of orders) {
    for (const ticket of order.tickets) {
      ticketsBought += 1;
      const result = checkTicket(ticket.num, draw);
      if (result.won) {
        drawsWon += 1;
        totalWon += result.amount ?? 0;
      }
    }
  }
  return { ticketsBought, drawsWon, totalWon };
}

export function createOrder(
  tickets: Ticket[],
  paymentMethod: PaymentMethod,
): Order {
  return {
    id: Date.now().toString(36).toUpperCase(),
    createdAt: new Date().toISOString(),
    tickets,
    total: cartTotal(tickets),
    paymentMethod,
  };
}
