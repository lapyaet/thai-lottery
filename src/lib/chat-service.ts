import { streamChunks } from "@/lib/chat";
import type { ChatMessage } from "@/types/chat.type";

export type ChatRequestOptions = {
  signal?: AbortSignal;
  locale?: string;
  /** Skip the artificial delays (reduced motion, tests). */
  instant?: boolean;
};

const STUB_REPLY: Record<string, string> = {
  en: "The AI service is not connected yet, so this is a placeholder reply. Once the API is added I will answer your lottery questions here.",
  my: "AI ဝန်ဆောင်မှုကို မချိတ်ဆက်ရသေးသဖြင့် ဤအဖြေသည် ယာယီအဖြေဖြစ်သည်။ API ထည့်သွင်းပြီးပါက ထီနှင့်ပတ်သက်သော မေးခွန်းများကို ဤနေရာတွင် ဖြေကြားပေးပါမည်။",
};

const THINK_MS = 900;
const CHUNK_MS = 28;

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

/**
 * The single AI seam. The UI, store and robot only depend on this contract:
 * give it the conversation, get the reply back as a stream of text pieces.
 * Today it is a stub; a later change replaces the body with a real API call.
 */
export async function* sendChatMessage(
  _history: ChatMessage[],
  { signal, locale = "en", instant = false }: ChatRequestOptions = {},
): AsyncGenerator<string> {
  if (!instant) await wait(THINK_MS, signal);
  for (const chunk of streamChunks(STUB_REPLY[locale] ?? STUB_REPLY.en)) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    yield chunk;
    if (!instant) await wait(CHUNK_MS, signal);
  }
}
