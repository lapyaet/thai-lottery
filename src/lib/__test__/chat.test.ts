import { createMessage, streamChunks } from "@/lib/chat";

describe("createMessage", () => {
  it("creates unique ids with role and text", () => {
    const a = createMessage("user", "hi");
    const b = createMessage("user", "hi");
    expect(a).toMatchObject({ role: "user", text: "hi" });
    expect(a.id).not.toBe(b.id);
    expect(createMessage("bot").text).toBe("");
  });
});

describe("streamChunks", () => {
  it("splits text and keeps it intact", () => {
    const chunks = streamChunks("Hello world", 4);
    expect(chunks).toEqual(["Hell", "o wo", "rld"]);
    expect(chunks.join("")).toBe("Hello world");
  });

  it("does not break Myanmar text apart into invalid pieces", () => {
    const text = "မင်္ဂလာပါ";
    expect(streamChunks(text, 2).join("")).toBe(text);
  });

  it("returns nothing for empty text", () => {
    expect(streamChunks("")).toEqual([]);
  });
});
