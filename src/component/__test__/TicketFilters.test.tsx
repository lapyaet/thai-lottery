import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TicketFilters from "@/component/ticket/TicketFilters";
import useFilterStore from "@/store/useFilterStore";
import { renderWithIntl } from "@/test-utils";

beforeEach(() => act(() => useFilterStore.getState().reset()));

describe("TicketFilters", () => {
  it("toggles categories in the store", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TicketFilters />);
    await user.click(screen.getByRole("checkbox", { name: "Ends in 0" }));
    await user.click(screen.getByRole("checkbox", { name: "Lucky" }));
    expect(useFilterStore.getState().categories).toEqual(["end0", "lucky"]);
    await user.click(screen.getByRole("checkbox", { name: "Ends in 0" }));
    expect(useFilterStore.getState().categories).toEqual(["lucky"]);
  });

  it("toggles the recommended chip", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TicketFilters />);
    const chip = screen.getByRole("button", { name: "Recommended tickets" });
    await user.click(chip);
    expect(useFilterStore.getState().isRecommended).toBe(true);
    expect(chip).toHaveAttribute("aria-pressed", "true");
  });

  it("selects a sort order and clears it when clicked again", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TicketFilters />);
    const radio = screen.getByLabelText("Number: low to high");
    await user.click(radio);
    expect(useFilterStore.getState().sortBy).toBe("lowToHigh");
    await user.click(radio);
    expect(useFilterStore.getState().sortBy).toBeNull();
  });

  it("resets every filter", async () => {
    const user = userEvent.setup();
    act(() =>
      useFilterStore.setState({
        search: "27",
        categories: ["end5"],
        isRecommended: true,
        sortBy: "highToLow",
      }),
    );
    renderWithIntl(<TicketFilters />);
    await user.click(screen.getByRole("button", { name: "Reset filters" }));
    expect(useFilterStore.getState()).toMatchObject({
      search: "",
      categories: [],
      isRecommended: false,
      sortBy: null,
    });
  });
});
