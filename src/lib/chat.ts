import type { ChatMessage, ChatRole } from "@/types/chat.type";

let counter = 0;

export function createMessage(role: ChatRole, text = ""): ChatMessage {
  counter += 1;
  return { id: `${role}-${Date.now().toString(36)}-${counter}`, role, text };
}

/** Split text into small pieces so a reply can be shown as if it were typed. */
export function streamChunks(text: string, size = 3): string[] {
  const chunks: string[] = [];
  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i += size) {
    chunks.push(chars.slice(i, i + size).join(""));
  }
  return chunks;
}
