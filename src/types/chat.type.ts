export type ChatRole = "user" | "bot";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

/** What the conversation is doing right now. */
export type ChatStatus = "idle" | "thinking" | "talking" | "error";
