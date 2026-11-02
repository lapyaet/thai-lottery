import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CartList from "@/component/cart/CartList";
import useCartStore from "@/store/useCartStore";
import { renderWithIntl } from "@/test-utils";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));
// The persisted store skips hydration in tests; treat it as hydrated.
jest.mock("@/hook/useHydrated", () => ({ useHydrated: () => true }));

const a = { num: "274916", price: 500, serial: "2G123456", drawDate: "2025-11-01" };
const b = { num: "888888", price: 700, serial: "3C125010", drawDate: "2025-11-01" };

beforeEach(() => act(() => useCartStore.setState({ items: [] })));

describe("CartList", () => {
  it("shows an empty state with a link back to the tickets", () => {
    renderWithIntl(<CartList />);
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse tickets" })).toHaveAttribute("href", "/");
  });

  it("lists tickets with quantity and total", () => {
    act(() => useCartStore.setState({ items: [a, b] }));
    renderWithIntl(<CartList />);
    expect(screen.getByText("274916")).toBeInTheDocument();
    expect(screen.getByText("888888")).toBeInTheDocument();
    expect(screen.getByText("2 tickets")).toBeInTheDocument();
    expect(screen.getAllByText("1,200 MMK").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Proceed to checkout →" })).toHaveAttribute("href", "/checkout");
  });

  it("removes a ticket and updates the summary", async () => {
    const user = userEvent.setup();
    act(() => useCartStore.setState({ items: [a, b] }));
    renderWithIntl(<CartList />);
    await user.click(screen.getByRole("button", { name: "Remove ticket 274916" }));
    expect(useCartStore.getState().items.map((t) => t.num)).toEqual(["888888"]);
    expect(await screen.findByText("1 ticket")).toBeInTheDocument();
  });
});
