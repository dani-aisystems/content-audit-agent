#!/usr/bin/env node
import { loadAsText } from "../src/extract-text.mjs";
import { runAudit } from "../src/audit.mjs";
import { renderMarkdownReport } from "../src/report.mjs";

function parseArgs(argv) {
  const args = { target: null, sources: [], output: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--target") args.target = argv[++i];
    else if (arg === "--source") args.sources.push(argv[++i]);
    else if (arg === "--output") args.output = argv[++i];
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function printHelp() {
  console.log(`content-audit-agent

Usage:
  ANTHROPIC_API_KEY=<key> npx content-audit-agent --target <url-or-file> --source <url-or-file> [--source <url-or-file> ...] [--output <file>]

Options:
  --target   Required. The content to audit (a URL or local .html/.md/.txt file).
  --source   Required, repeatable. One or more source-of-truth documents/URLs to check claims against.
  --output   Write the report to a file instead of stdout.

Env vars:
  ANTHROPIC_API_KEY   Required. This tool's entire value is the grounded audit — there is no
                       meaningful fallback mode without it.

Try it against the bundled example:
  ANTHROPIC_API_KEY=<key> npx content-audit-agent --target examples/target.html --source examples/source.md
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return printHelp();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required.");
    process.exitCode = 1;
    return;
  }
  if (!args.target || args.sources.length === 0) {
    console.error("Error: --target and at least one --source are required. Run --help for usage.");
    process.exitCode = 1;
    return;
  }

  const targetText = await loadAsText(args.target);
  const sourceTexts = await Promise.all(args.sources.map(loadAsText));

  const findings = await runAudit({
    apiKey,
    targetText,
    sourceTexts,
    sourceLabels: args.sources,
  });

  const report = renderMarkdownReport({ target: args.target, sources: args.sources, findings });

  if (args.output) {
    const { writeFile } = await import("node:fs/promises");
    await writeFile(args.output, report, "utf8");
    console.error(`Report written to ${args.output}`);
  } else {
    console.log(report);
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exitCode = 1;
});
