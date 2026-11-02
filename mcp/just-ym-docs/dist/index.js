#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const repoRoot = process.env.JUST_YM_REPO;
if (!repoRoot) {
    console.error("JUST_YM_REPO must point to a clone of just-ym-hotel-ticket");
    process.exit(1);
}
const root = path.resolve(repoRoot);
// Top-level files plus every markdown file under these folders.
const ROOT_FILES = ["README.md", "AGENTS.md", "CLAUDE.md"];
const DOC_DIRS = ["docs", "spec"];
async function walk(dir) {
    const entries = await readdir(path.join(root, dir), { withFileTypes: true }).catch(() => []);
    const out = [];
    for (const e of entries) {
        const rel = path.posix.join(dir, e.name);
        if (e.isDirectory())
            out.push(...(await walk(rel)));
        else if (e.name.endsWith(".md"))
            out.push(rel);
    }
    return out;
}
async function listDocs() {
    const found = await Promise.all(DOC_DIRS.map(walk));
    const roots = [];
    for (const f of ROOT_FILES) {
        if (await readFile(path.join(root, f)).then(() => true, () => false))
            roots.push(f);
    }
    return [...roots, ...found.flat()].sort();
}
function resolveDoc(rel) {
    const full = path.resolve(root, rel);
    if (!full.startsWith(root + path.sep) || !full.endsWith(".md")) {
        throw new Error("Path must be a markdown file inside the repo");
    }
    return full;
}
const text = (t) => ({ content: [{ type: "text", text: t }] });
const server = new McpServer({ name: "just-ym-docs", version: "0.1.0" });
server.registerTool("list_docs", { description: "List the markdown docs and specs of the Just YM hotel-ticket repo." }, async () => text((await listDocs()).join("\n")));
server.registerTool("read_doc", {
    description: "Read one doc by repo-relative path, e.g. spec/specs/002-hotel-search/spec.md.",
    inputSchema: { path: z.string() },
}, async ({ path: rel }) => {
    try {
        return text(await readFile(resolveDoc(rel), "utf8"));
    }
    catch (e) {
        return { ...text(`Cannot read ${rel}: ${e.message}`), isError: true };
    }
});
server.registerTool("search_docs", {
    description: "Case-insensitive text search across all docs. Returns path:line: match.",
    inputSchema: { query: z.string().min(1), max_results: z.number().int().positive().default(50) },
}, async ({ query, max_results }) => {
    const q = query.toLowerCase();
    const hits = [];
    for (const rel of await listDocs()) {
        const lines = (await readFile(path.join(root, rel), "utf8")).split("\n");
        for (let i = 0; i < lines.length && hits.length < max_results; i++) {
            if (lines[i].toLowerCase().includes(q))
                hits.push(`${rel}:${i + 1}: ${lines[i].trim()}`);
        }
        if (hits.length >= max_results)
            break;
    }
    return text(hits.length ? hits.join("\n") : "No matches");
});
await server.connect(new StdioServerTransport());
