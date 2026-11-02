import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TicketCard from "@/component/ticket/TicketCard";
import useCartStore from "@/store/useCartStore";
import useToastStore from "@/store/useToastStore";
import { renderWithIntl } from "@/test-utils";
import type { Ticket } from "@/types/lottery.type";

const ticket: Ticket = {
  num: "274916",
  price: 500,
  serial: "2G123456",
  drawDate: "2025-11-01",
};

beforeEach(() => {
  act(() => {
    useCartStore.setState({ items: [] });
    useToastStore.setState({ message: null });
  });
});

describe("TicketCard", () => {
  it("shows number, serial and price", () => {
    renderWithIntl(<ul><TicketCard ticket={ticket} /></ul>);
    expect(screen.getByText("274916")).toBeInTheDocument();
    expect(screen.getByText("Serial: 2G123456")).toBeInTheDocument();
    expect(screen.getByText("500 MMK")).toBeInTheDocument();
  });

  it("adds to and removes from the cart, with a toast", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ul><TicketCard ticket={ticket} /></ul>);

    await user.click(screen.getByRole("button", { name: "+ Add" }));
    expect(useCartStore.getState().has("274916")).toBe(true);
    expect(useToastStore.getState().message).toBe("Added to cart");
    expect(screen.getByRole("button", { name: "✓ In cart" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "✓ In cart" }));
    expect(useCartStore.getState().has("274916")).toBe(false);
    expect(useToastStore.getState().message).toBe("Removed from cart");
  });
});
