# content-audit-agent

[![CI](https://github.com/dani-aisystems/content-audit-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/dani-aisystems/content-audit-agent/actions/workflows/ci.yml)

Audits a page's factual claims against a source-of-truth document and reports each one as **supported**, **contradicted**, or **unverifiable** — with a direct quote as evidence, or an explicit "nothing found" instead of a guess.

## Why this exists

The naive version of this idea — "ask an LLM to review my website for accuracy" — hallucinates. It has no grounding, so it either invents confidence it doesn't have or invents problems that don't exist. This tool forces every finding to cite a direct quote from a real source document, or be explicitly marked unverifiable. That sourcing discipline is the entire point; without it, this is just a worse version of asking ChatGPT to "check my site."

This isn't a hypothetical: it's the process I used by hand to audit a client site's copy against their real business (catching a wrong legal registration number, fabricated statistics, and a phone number that matched no source anywhere). This tool is that process, generalized.

## Architecture

- **Direct context injection, not RAG.** A single page and a handful of source documents are small enough to pass to the model whole. Chunking/embedding/vector search would add complexity this problem doesn't need — RAG earns its cost on large or constantly-changing corpora, not a one-page audit.
- **A single model call with a forced tool call**, not a multi-agent pipeline. The task is one classification pass per claim, not a multi-step workflow requiring handoffs or state — multi-agent orchestration here would be complexity for its own sake.
- **Structured output via Anthropic tool-use** (`tool_choice` forcing a `report_findings` call), validated again with Zod on the way out. Two layers of defense against malformed output reaching the report.
- **Plain-text extraction, not a headless browser**, for v1. Handles static and server-rendered HTML (e.g. Next.js SSR output). Client-rendered-only content isn't visible to it yet — a known, documented limitation, not a silent failure.

## Usage

```bash
ANTHROPIC_API_KEY=<key> npx content-audit-agent --target <url-or-file> --source <url-or-file> [--source <url-or-file> ...] [--output <file>]
```

Try it against the bundled example (a fictional company page with a fabricated statistic, an invented performance claim, and a contradicted headcount and support-hours claim):

```bash
ANTHROPIC_API_KEY=<key> npx content-audit-agent --target examples/target.html --source examples/source.md
```

## Status

- ✅ Core audit engine (extraction → grounded classification → validated structured report) — implemented and tested.
- ✅ Non-LLM pipeline (text extraction, schema validation, report rendering) has automated tests (`npm test`) that run in CI against canned findings — no API key required to verify this part.
- ⚠️ The live Anthropic API call path is implemented against the documented Messages API shape but has not yet been run end-to-end by me against a live key — I don't have one in the environment this was built in. If you hit an issue running it for real, it's most likely here; please open an issue.
- 🔜 Not yet built: a hosted Next.js dashboard for browsing reports (was in the original project scope, deferred as a fast-follow rather than blocking the CLI's release).

## License

MIT — see [LICENSE](./LICENSE).
