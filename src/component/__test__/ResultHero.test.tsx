import { screen } from "@testing-library/react";
import ResultHero from "@/component/result/ResultHero";
import { renderWithIntl } from "@/test-utils";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

describe("ResultHero", () => {
  it("exposes the winning number and prize", () => {
    renderWithIntl(<ResultHero date="1 November 2025" number="274916" amount={1_000_000} />);
    expect(screen.getByRole("img", { name: "274916" })).toBeInTheDocument();
    expect(screen.getByText(/1,000,000 MMK/)).toBeInTheDocument();
    expect(screen.getByText("Result · Draw Date: 1 November 2025")).toBeInTheDocument();
  });

  it("links to the ticket checker and winners list", () => {
    renderWithIntl(<ResultHero date="d" number="274916" amount={1} />);
    expect(screen.getByRole("link", { name: "Check my ticket" })).toHaveAttribute("href", "/winners");
    expect(screen.getByRole("link", { name: "See all winners" })).toHaveAttribute("href", "/winners#all");
  });
});
