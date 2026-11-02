import { screen } from "@testing-library/react";
import MainNav from "@/component/header/MainNav";
import { renderWithIntl } from "@/test-utils";

let pathname = "/";
jest.mock("@/i18n/navigation", () => ({
  usePathname: () => pathname,
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

describe("MainNav", () => {
  it("renders the public sections", () => {
    renderWithIntl(<MainNav />);
    expect(screen.getAllByRole("link")).toHaveLength(5);
    expect(screen.getByRole("link", { name: "Winners" })).toHaveAttribute("href", "/winners");
    expect(screen.getByRole("link", { name: "AI chat" })).toHaveAttribute("href", "/chat");
  });

  it("marks only the current section active", () => {
    pathname = "/results";
    renderWithIntl(<MainNav />);
    expect(screen.getByRole("link", { name: "Results" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Tickets" })).not.toHaveAttribute("aria-current");
  });
});
