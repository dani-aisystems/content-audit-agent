import { readFile } from "node:fs/promises";

const ENTITY_MAP = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
  nbsp: " ",
};

function decodeEntities(str) {
  return str.replace(/&(#39|amp|lt|gt|quot|nbsp);/g, (_, name) => ENTITY_MAP[name] ?? _);
}

// Deliberately simple: strips tags/scripts/styles and collapses whitespace.
// Handles static/server-rendered HTML (e.g. Next.js SSR output). Does not
// execute JavaScript, so client-rendered-only content won't be visible —
// documented as a known limitation, not silently wrong.
export function htmlToText(html) {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const withoutTags = withoutScripts.replace(/<[^>]+>/g, " ");
  const decoded = decodeEntities(withoutTags);
  return decoded.replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();
}

async function readSource(pathOrUrl) {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    const res = await fetch(pathOrUrl, {
      headers: { "User-Agent": "content-audit-agent" },
    });
    if (!res.ok) throw new Error(`Failed to fetch ${pathOrUrl}: ${res.status}`);
    return res.text();
  }
  return readFile(pathOrUrl, "utf8");
}

export async function loadAsText(pathOrUrl) {
  const raw = await readSource(pathOrUrl);
  const looksLikeHtml = /<\s*(html|body|div|section|p)\b/i.test(raw.slice(0, 2000));
  return looksLikeHtml ? htmlToText(raw) : raw.trim();
}
