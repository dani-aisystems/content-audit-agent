import { AuditResultSchema, AUDIT_TOOL_INPUT_SCHEMA } from "./schema.mjs";

const SYSTEM_PROMPT = `You are a content auditor. You are given TARGET content (e.g. a website page) and one or more SOURCE-OF-TRUTH documents.

Your job: extract every factual, checkable claim from the TARGET (numbers, names, dates, certifications, contact details, capability claims, terminology) and classify each one:
- "supported": the source(s) contain a matching statement — quote it as evidence.
- "contradicted": the source(s) contain a conflicting statement — quote it as evidence.
- "unverifiable": the source(s) contain nothing that confirms or denies it — evidence is null. Do NOT guess or assume a claim is fine just because it sounds plausible.

Rules:
- Every claim needs a direct quote as evidence, or null if unverifiable. Never paraphrase evidence into something that sounds more supportive than the actual source text.
- Do not invent claims that aren't in the target. Do not skip claims because they seem unimportant — sourcing discipline applies uniformly, severity is a separate judgment.
- severity: "critical" if a reader/customer relying on this claim could be materially misled or harmed (wrong legal/contact info, fabricated certifications, invented statistics). "high" if it undermines trust but isn't materially harmful. "medium" if it's a minor inconsistency. "low" if it's stylistic.
- Call the report_findings tool exactly once with the complete findings list.`;

export async function runAudit({ apiKey, targetText, sourceTexts, sourceLabels, model = "claude-sonnet-5" }) {
  const userContent = [
    `TARGET CONTENT:\n${targetText}`,
    ...sourceTexts.map((text, i) => `SOURCE OF TRUTH (${sourceLabels[i]}):\n${text}`),
  ].join("\n\n---\n\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
      tools: [
        {
          name: "report_findings",
          description: "Report the structured audit findings.",
          input_schema: AUDIT_TOOL_INPUT_SCHEMA,
        },
      ],
      tool_choice: { type: "tool", name: "report_findings" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API failed: ${res.status} ${body.slice(0, 500)}`);
  }

  const data = await res.json();
  const toolUse = data.content.find((block) => block.type === "tool_use" && block.name === "report_findings");
  if (!toolUse) {
    throw new Error("Model did not return a report_findings tool call — cannot produce a report.");
  }

  const parsed = AuditResultSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error(`Model output failed schema validation: ${parsed.error.message}`);
  }

  return parsed.data.findings;
}
