import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CheckTicketForm from "@/component/winner/CheckTicketForm";
import { getLatestDraw } from "@/lib/lottery-data";
import { renderWithIntl } from "@/test-utils";

const setup = () => {
  const user = userEvent.setup();
  renderWithIntl(<CheckTicketForm draw={getLatestDraw()} />);
  const input = screen.getByLabelText("Ticket number");
  const submit = screen.getByRole("button", { name: "Check" });
  return { user, input, submit };
};

describe("CheckTicketForm", () => {
  it("requires a ticket number", async () => {
    const { user, submit } = setup();
    await user.click(submit);
    expect(await screen.findByRole("alert")).toHaveTextContent("This field is required");
  });

  it("requires exactly 6 digits", async () => {
    const { user, input, submit } = setup();
    await user.type(input, "123");
    await user.click(submit);
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter exactly 6 digits");
  });

  it("rejects non-digits", async () => {
    const { user, input, submit } = setup();
    await user.type(input, "12ab56");
    await user.click(submit);
    expect(await screen.findByRole("alert")).toHaveTextContent("Digits only");
  });

  it("shows a win for the first prize number", async () => {
    const { user, input, submit } = setup();
    await user.type(input, "274916");
    await user.click(submit);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Congratulations! Your ticket wins the 1st Prize: 1,000,000 MMK",
    );
  });

  it("shows a loss for a non-winning number", async () => {
    const { user, input, submit } = setup();
    await user.type(input, "999999");
    await user.click(submit);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Sorry, ticket 999999 did not win this draw.",
    );
  });
});
