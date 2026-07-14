import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { htmlToText, loadAsText } from "../src/extract-text.mjs";

const fixturePath = fileURLToPath(new URL("../examples/target.html", import.meta.url));

test("htmlToText strips tags and keeps visible content", async () => {
  const html = await readFile(fixturePath, "utf8");
  const text = htmlToText(html);

  assert.ok(!text.includes("<"), "no raw tags should remain");
  assert.ok(text.includes("Acme Robotics"));
  assert.ok(text.includes("Trusted by over 500 warehouses worldwide"));
  assert.ok(text.includes("24/7 customer support"));
});

test("loadAsText reads a local HTML file and extracts text", async () => {
  const text = await loadAsText(fixturePath);
  assert.ok(text.includes("40+ robotics engineers"));
});

test("loadAsText reads a local plain-text/markdown file as-is (trimmed)", async () => {
  const sourcePath = fileURLToPath(new URL("../examples/source.md", import.meta.url));
  const text = await loadAsText(sourcePath);
  assert.ok(text.startsWith("# Acme Robotics"));
  assert.ok(text.includes("12 full-time employees"));
});
