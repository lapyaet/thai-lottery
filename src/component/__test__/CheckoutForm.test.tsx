import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CheckoutForm from "@/component/checkout/CheckoutForm";
import useCartStore from "@/store/useCartStore";
import useOrderStore from "@/store/useOrderStore";
import { renderWithIntl } from "@/test-utils";

const push = jest.fn();
jest.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push, replace: jest.fn() }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
// The persisted stores skip hydration in tests; mark the cart as hydrated.
jest.mock("@/hook/useHydrated", () => ({ useHydrated: () => true }));

const ticket = { num: "274916", price: 500, serial: "2G", drawDate: "2025-11-01" };

beforeEach(() => {
  push.mockClear();
  act(() => {
    useCartStore.setState({ items: [ticket] });
    useOrderStore.setState({ orders: [] });
  });
});

describe("CheckoutForm", () => {
  it("shows an empty state when the cart is empty", () => {
    act(() => useCartStore.setState({ items: [] }));
    renderWithIntl(<CheckoutForm />);
    expect(screen.getByText("Your cart is empty.")).toBeInTheDocument();
  });

  it("validates buyer details", async () => {
    const user = userEvent.setup();
    renderWithIntl(<CheckoutForm />);
    await user.click(screen.getByRole("button", { name: /Confirm order/ }));
    expect((await screen.findAllByRole("alert")).length).toBeGreaterThanOrEqual(3);
    expect(useOrderStore.getState().orders).toHaveLength(0);
  });

  it("places an order, clears the cart and goes to the profile", async () => {
    const user = userEvent.setup();
    renderWithIntl(<CheckoutForm />);
    await user.type(screen.getByLabelText(/Full name/), "Aung Aung");
    await user.type(screen.getByLabelText(/Phone number/), "09450012345");
    await user.type(screen.getByLabelText(/NRC number/), "12/OUKAMA(N)123456");
    await user.click(screen.getByLabelText(/Bank transfer/));
    await user.click(screen.getByRole("button", { name: /Confirm order/ }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/profile"), { timeout: 3000 });
    const [order] = useOrderStore.getState().orders;
    expect(order.total).toBe(500);
    expect(order.paymentMethod).toBe("bank");
    expect(useCartStore.getState().items).toEqual([]);
  });
});
