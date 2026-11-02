import { sendChatMessage } from "@/lib/chat-service";

async function collect(gen: AsyncIterable<string>) {
  let out = "";
  for await (const chunk of gen) out += chunk;
  return out;
}

describe("sendChatMessage (stub)", () => {
  it("streams a reply in the requested locale", async () => {
    const en = await collect(sendChatMessage([], { instant: true }));
    const my = await collect(sendChatMessage([], { instant: true, locale: "my" }));
    expect(en).toMatch(/not connected/i);
    expect(my).not.toBe(en);
  });

  it("falls back to English for unknown locales", async () => {
    const out = await collect(sendChatMessage([], { instant: true, locale: "xx" }));
    expect(out).toMatch(/not connected/i);
  });

  it("stops when aborted", async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(
      collect(sendChatMessage([], { instant: true, signal: ctrl.signal })),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});
