import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RobotBubble from "@/component/chat/RobotBubble";
import useChatStore from "@/store/useChatStore";
import { renderWithIntl } from "@/test-utils";

const set = (state: Partial<ReturnType<typeof useChatStore.getState>>) =>
  act(() => useChatStore.setState(state));

beforeEach(() => act(() => useChatStore.getState().clear()));

describe("RobotBubble", () => {
  it("greets before the conversation starts", () => {
    renderWithIntl(<RobotBubble />);
    expect(screen.getByText(/I'm Lotto Bot/)).toBeInTheDocument();
  });

  it("shows only the question and typing dots while thinking", () => {
    set({ messages: [{ id: "u1", role: "user", text: "hi" }], status: "thinking" });
    renderWithIntl(<RobotBubble />);
    expect(screen.getByText("hi")).toBeInTheDocument();
    expect(screen.queryByText(/I'm Lotto Bot/)).not.toBeInTheDocument();
    expect(screen.queryByText(/not connected/)).not.toBeInTheDocument();
  });

  it("shows the latest bot reply as it grows", () => {
    set({
      messages: [
        { id: "u1", role: "user", text: "hi" },
        { id: "b1", role: "bot", text: "Hello" },
      ],
      status: "talking",
    });
    renderWithIntl(<RobotBubble />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    set({
      messages: [
        { id: "u1", role: "user", text: "hi" },
        { id: "b1", role: "bot", text: "Hello there" },
      ],
    });
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  it("shows the error text", () => {
    set({ messages: [{ id: "u1", role: "user", text: "hi" }], status: "error" });
    renderWithIntl(<RobotBubble />);
    expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
  });

  it("echoes the last question above the answer", () => {
    set({
      messages: [
        { id: "u1", role: "user", text: "What is the draw?" },
        { id: "b1", role: "bot", text: "Hello" },
      ],
      status: "idle",
    });
    renderWithIntl(<RobotBubble />);
    expect(screen.getByText("What is the draw?")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("offers Try again on error", async () => {
    set({ messages: [{ id: "u1", role: "user", text: "hi" }], status: "error" });
    renderWithIntl(<RobotBubble />);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(useChatStore.getState().status).toBe("thinking");
  });
});
