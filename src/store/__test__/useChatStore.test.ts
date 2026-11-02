import { act } from "@testing-library/react";
import { sendChatMessage } from "@/lib/chat-service";
import useChatStore from "@/store/useChatStore";

jest.mock("@/lib/chat-service", () => {
  const actual = jest.requireActual("@/lib/chat-service");
  return { ...actual, sendChatMessage: jest.fn(actual.sendChatMessage) };
});

const reset = () => act(() => useChatStore.getState().clear());
beforeEach(reset);
afterEach(() => jest.restoreAllMocks());

describe("useChatStore", () => {
  it("sends a message, gets a streamed reply and returns to idle", async () => {
    await act(() => useChatStore.getState().send("  hello  ", { instant: true }));
    const { messages, status } = useChatStore.getState();
    expect(status).toBe("idle");
    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({ role: "user", text: "hello" });
    expect(messages[1].role).toBe("bot");
    expect(messages[1].text.length).toBeGreaterThan(10);
  });

  it("ignores empty input", async () => {
    await act(() => useChatStore.getState().send("   ", { instant: true }));
    expect(useChatStore.getState().messages).toHaveLength(0);
  });

  it("goes through thinking and talking", async () => {
    const seen: string[] = [useChatStore.getState().status];
    const unsubscribe = useChatStore.subscribe((s) => {
      if (seen[seen.length - 1] !== s.status) seen.push(s.status);
    });
    await act(() => useChatStore.getState().send("hi", { instant: true }));
    unsubscribe();
    expect(seen).toEqual(["idle", "thinking", "talking", "idle"]);
  });

  it("ignores a new message while the bot is busy", async () => {
    const first = useChatStore.getState().send("one", { instant: true });
    await useChatStore.getState().send("two", { instant: true });
    await act(() => first);
    expect(useChatStore.getState().messages.filter((m) => m.role === "user")).toHaveLength(1);
  });

  it("reports an error and recovers on retry", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.mocked(sendChatMessage).mockImplementationOnce(async function* () {
      throw new Error("offline");
    });
    await act(() => useChatStore.getState().send("hi", { instant: true }));
    expect(useChatStore.getState().status).toBe("error");

    await act(() => useChatStore.getState().retry({ instant: true }));
    const { status, messages } = useChatStore.getState();
    expect(status).toBe("idle");
    expect(messages.filter((m) => m.role === "user")).toHaveLength(1);
    expect(messages[messages.length - 1].role).toBe("bot");
  });

  it("clears the conversation", async () => {
    await act(() => useChatStore.getState().send("hi", { instant: true }));
    act(() => useChatStore.getState().clear());
    expect(useChatStore.getState()).toMatchObject({ messages: [], status: "idle" });
  });
});
