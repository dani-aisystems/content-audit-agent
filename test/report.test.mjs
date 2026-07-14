import { test } from "node:test";
import assert from "node:assert/strict";
import { AuditResultSchema } from "../src/schema.mjs";
import { renderMarkdownReport } from "../src/report.mjs";

// Canned findings representing what a real audit run against examples/target.html
// and examples/source.md should plausibly produce. This lets the validation and
// rendering pipeline be tested deterministically, without a live Anthropic API call.
const CANNED_FINDINGS = [
  {
    claim: "Founded in 2019, headquartered in Austin, Texas.",
    status: "supported",
    evidence: "Founded: 2019 ... Headquarters: Austin, Texas",
    severity: "low",
    reasoning: "Matches the fact sheet exactly.",
  },
  {
    claim: "Trusted by over 500 warehouses worldwide",
    status: "unverifiable",
    evidence: null,
    severity: "high",
    reasoning: "No customer-count figures have been published anywhere in the source.",
  },
  {
    claim: "A team of 40+ robotics engineers",
    status: "contradicted",
    evidence: "Team: 12 full-time employees",
    severity: "critical",
    reasoning: "Directly contradicts the documented headcount; materially misleading.",
  },
  {
    claim: "24/7 customer support, every day of the year",
    status: "contradicted",
    evidence: "Support hours: Monday-Friday, 9am-5pm CT",
    severity: "critical",
    reasoning: "A customer relying on this would be misled about actual support availability.",
  },
  {
    claim: "Our Atlas-1 picks items 3x faster than manual labor",
    status: "unverifiable",
    evidence: null,
    severity: "high",
    reasoning: "No throughput benchmark exists in the source to support this comparison.",
  },
];

test("canned findings satisfy the audit result schema", () => {
  const parsed = AuditResultSchema.safeParse({ findings: CANNED_FINDINGS });
  assert.equal(parsed.success, true, parsed.success ? "" : parsed.error?.message);
});

test("renderMarkdownReport surfaces critical findings and a non-clean verdict", () => {
  const report = renderMarkdownReport({
    target: "examples/target.html",
    sources: ["examples/source.md"],
    findings: CANNED_FINDINGS,
  });

  assert.match(report, /Not ready — critical unsourced\/contradicted claims found/);
  assert.match(report, /Critical findings/);
  assert.match(report, /40\+ robotics engineers/);
  assert.match(report, /\*none found in source\(s\)\*/);
  assert.match(report, /1 supported claim\(s\)/);
});

test("renderMarkdownReport reports a clean verdict when everything is supported", () => {
  const report = renderMarkdownReport({
    target: "x",
    sources: ["y"],
    findings: [CANNED_FINDINGS[0]],
  });
  assert.match(report, /Clean — every claim traced to a source/);
});
