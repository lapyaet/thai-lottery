import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatComposer from "@/component/chat/ChatComposer";
import useChatStore from "@/store/useChatStore";
import { renderWithIntl } from "@/test-utils";

beforeEach(() => act(() => useChatStore.getState().clear()));

describe("ChatComposer", () => {
  it("offers suggestions before the first message", () => {
    renderWithIntl(<ChatComposer />);
    expect(screen.getByRole("button", { name: "How do I buy a ticket?" })).toBeInTheDocument();
  });

  it("disables Send until there is text", async () => {
    renderWithIntl(<ChatComposer />);
    const send = screen.getByRole("button", { name: "Send" });
    expect(send).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Message"), "hi");
    expect(send).toBeEnabled();
  });

  it("sends with Enter, clears the box and tells the robot", async () => {
    const onTyping = jest.fn();
    const onSend = jest.fn();
    renderWithIntl(<ChatComposer onTyping={onTyping} onSend={onSend} />);
    const input = screen.getByLabelText("Message");
    await userEvent.type(input, "hello{Enter}");
    expect(onTyping).toHaveBeenCalled();
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue("");
    expect(useChatStore.getState().messages[0]).toMatchObject({ role: "user", text: "hello" });
  });

  it("sends a suggestion and hides the chips afterwards", async () => {
    renderWithIntl(<ChatComposer />);
    await userEvent.click(screen.getByRole("button", { name: "What is the latest draw result?" }));
    expect(useChatStore.getState().messages[0].text).toBe("What is the latest draw result?");
    await waitFor(() =>
      expect(screen.queryByRole("group", { name: "Suggestions" })).not.toBeInTheDocument(),
    );
  });

  it("does not show replies itself", async () => {
    renderWithIntl(<ChatComposer />);
    await userEvent.type(screen.getByLabelText("Message"), "hi{Enter}");
    expect(screen.queryByText("hi")).not.toBeInTheDocument();
  });

  it("clears the conversation and tells the robot", async () => {
    const onClear = jest.fn();
    renderWithIntl(<ChatComposer onClear={onClear} />);
    expect(screen.getByRole("button", { name: "Clear chat" })).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Message"), "hi{Enter}");
    await userEvent.click(screen.getByRole("button", { name: "Clear chat" }));
    expect(useChatStore.getState().messages).toHaveLength(0);
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
