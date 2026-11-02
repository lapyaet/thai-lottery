import { create } from "zustand";
import { createMessage } from "@/lib/chat";
import { sendChatMessage } from "@/lib/chat-service";
import type { ChatMessage, ChatStatus } from "@/types/chat.type";

type SendOptions = { locale?: string; instant?: boolean };

type ChatState = {
  messages: ChatMessage[];
  status: ChatStatus;
  send: (text: string, options?: SendOptions) => Promise<void>;
  /** Ask again after an error. */
  retry: (options?: SendOptions) => Promise<void>;
  clear: () => void;
};

let controller: AbortController | null = null;

/** The conversation lives in memory only; it is not persisted. */
const useChatStore = create<ChatState>()((set, get) => {
  async function reply(options: SendOptions) {
    controller?.abort();
    const ctrl = new AbortController();
    controller = ctrl;
    set({ status: "thinking" });

    const history = get().messages;
    const botMessage = createMessage("bot");
    let started = false;
    try {
      for await (const chunk of sendChatMessage(history, {
        ...options,
        signal: ctrl.signal,
      })) {
        if (ctrl.signal.aborted) return;
        if (!started) {
          started = true;
          set((s) => ({
            messages: [...s.messages, { ...botMessage, text: chunk }],
            status: "talking",
          }));
        } else {
          set((s) => ({
            messages: s.messages.map((m) =>
              m.id === botMessage.id ? { ...m, text: m.text + chunk } : m,
            ),
          }));
        }
      }
      if (!ctrl.signal.aborted) set({ status: "idle" });
    } catch (error) {
      if (ctrl.signal.aborted) return;
      console.error("chat reply failed", error);
      set({ status: "error" });
    }
  }

  return {
    messages: [],
    status: "idle",
    async send(text, options = {}) {
      const clean = text.trim();
      const { status } = get();
      if (!clean || status === "thinking" || status === "talking") return;
      set((s) => ({
        messages: [...s.messages, createMessage("user", clean)],
      }));
      await reply(options);
    },
    async retry(options = {}) {
      if (get().status !== "error") return;
      await reply(options);
    },
    clear() {
      controller?.abort();
      controller = null;
      set({ messages: [], status: "idle" });
    },
  };
});

export default useChatStore;
