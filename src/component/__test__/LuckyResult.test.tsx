import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LuckyResult from "@/component/lucky/LuckyResult";
import useCartStore from "@/store/useCartStore";
import useToastStore from "@/store/useToastStore";
import { renderWithIntl } from "@/test-utils";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

const ticket = { num: "428160", price: 500, serial: "7K123456", drawDate: "2025-11-01" };

beforeEach(() =>
  act(() => {
    useCartStore.setState({ items: [] });
    useToastStore.setState({ message: null });
  }),
);

describe("LuckyResult", () => {
  it("shows the generated ticket", () => {
    renderWithIntl(<LuckyResult ticket={ticket} onAgain={() => {}} onClose={() => {}} />);
    expect(screen.getByRole("img", { name: "428160" })).toBeInTheDocument();
    expect(screen.getByText(/Serial: 7K123456/)).toBeInTheDocument();
    expect(screen.getByText("500 MMK")).toBeInTheDocument();
  });

  it("adds the ticket to the cart, then offers a link to the cart", async () => {
    const user = userEvent.setup();
    renderWithIntl(<LuckyResult ticket={ticket} onAgain={() => {}} onClose={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(useCartStore.getState().has("428160")).toBe(true);
    expect(useToastStore.getState().message).toBe("Added to cart");
    expect(screen.getByRole("link", { name: /view cart/ })).toHaveAttribute("href", "/cart");
  });

  it("calls onAgain", async () => {
    const user = userEvent.setup();
    const onAgain = jest.fn();
    renderWithIntl(<LuckyResult ticket={ticket} onAgain={onAgain} onClose={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Generate again" }));
    expect(onAgain).toHaveBeenCalledTimes(1);
  });

  it("has a close button with an icon that closes the card", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    renderWithIntl(<LuckyResult ticket={ticket} onAgain={() => {}} onClose={onClose} />);
    const close = screen.getByRole("button", { name: "Close" });
    expect(close.querySelector("svg")).toBeInTheDocument();
    await user.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes with the Escape key", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    renderWithIntl(<LuckyResult ticket={ticket} onAgain={() => {}} onClose={onClose} />);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
