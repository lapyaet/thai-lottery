import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PrizeTabs from "@/component/result/PrizeTabs";
import { getLatestDraw } from "@/lib/lottery-data";
import { renderWithIntl } from "@/test-utils";

describe("PrizeTabs", () => {
  it("shows the top prizes first", () => {
    renderWithIntl(<PrizeTabs groups={getLatestDraw().groups} />);
    expect(screen.getByRole("tab", { name: "Top prizes" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("2nd Prize")).toBeInTheDocument();
    expect(screen.getByText("183462")).toBeInTheDocument();
    expect(screen.getAllByText("200,000 MMK per ticket")).toHaveLength(1);
    expect(screen.queryByText("Front 3 Digits")).not.toBeInTheDocument();
  });

  it("switches to digit prizes", async () => {
    const user = userEvent.setup();
    renderWithIntl(<PrizeTabs groups={getLatestDraw().groups} />);
    await user.click(screen.getByRole("tab", { name: "Digit prizes" }));
    expect(await screen.findByText("Front 3 Digits")).toBeInTheDocument();
    expect(screen.getByText("Last 2 Digits")).toBeInTheDocument();
    expect(screen.getByText("40,000 MMK per ticket")).toBeInTheDocument();
    expect(screen.queryByText("2nd Prize")).not.toBeInTheDocument();
  });
});
