import { act, screen } from "@testing-library/react";
import ChatLog from "@/component/chat/ChatLog";
import useChatStore from "@/store/useChatStore";
import { renderWithIntl } from "@/test-utils";

it("lists the conversation with speaker names for screen readers", () => {
  act(() =>
    useChatStore.setState({
      status: "idle",
      messages: [
        { id: "u", role: "user", text: "hi" },
        { id: "b", role: "bot", text: "hello" },
      ],
    }),
  );
  renderWithIntl(<ChatLog />);
  expect(screen.getByRole("log")).toBeInTheDocument();
  expect(screen.getByText("You: hi")).toBeInTheDocument();
  expect(screen.getByText("Lotto Bot: hello")).toBeInTheDocument();
});
