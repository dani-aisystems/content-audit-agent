const SEVERITY_ORDER = ["critical", "high", "medium", "low"];
const STATUS_LABEL = {
  contradicted: "Contradicted",
  unverifiable: "Unverifiable",
  supported: "Supported",
};

function verdict(findings) {
  const flagged = findings.filter((f) => f.status !== "supported");
  if (flagged.some((f) => f.severity === "critical")) return "Not ready — critical unsourced/contradicted claims found";
  if (flagged.length > 0) return "Needs review before publishing";
  return "Clean — every claim traced to a source";
}

export function renderMarkdownReport({ target, sources, findings }) {
  const lines = [
    `# Content Audit Report`,
    "",
    `**Target:** ${target}`,
    `**Source(s) of truth:** ${sources.join(", ")}`,
    `**Verdict:** ${verdict(findings)}`,
    "",
  ];

  const counts = SEVERITY_ORDER.reduce((acc, sev) => {
    acc[sev] = findings.filter((f) => f.status !== "supported" && f.severity === sev).length;
    return acc;
  }, {});
  lines.push(
    `| Severity | Count |`,
    `|---|---|`,
    ...SEVERITY_ORDER.map((sev) => `| ${sev} | ${counts[sev]} |`),
    ""
  );

  const flagged = findings.filter((f) => f.status !== "supported");
  const supported = findings.filter((f) => f.status === "supported");

  if (flagged.length === 0) {
    lines.push("No unsourced or contradicted claims found.", "");
  } else {
    for (const sev of SEVERITY_ORDER) {
      const inSeverity = flagged.filter((f) => f.severity === sev);
      if (inSeverity.length === 0) continue;
      lines.push(`## ${sev[0].toUpperCase()}${sev.slice(1)} findings`, "");
      for (const f of inSeverity) {
        lines.push(
          `- **[${STATUS_LABEL[f.status]}]** "${f.claim}"`,
          `  - Evidence: ${f.evidence ? `"${f.evidence}"` : "*none found in source(s)*"}`,
          `  - ${f.reasoning}`,
          ""
        );
      }
    }
  }

  if (supported.length > 0) {
    lines.push(
      `<details><summary>${supported.length} supported claim(s)</summary>`,
      "",
      ...supported.map((f) => `- "${f.claim}" — ${f.evidence ? `"${f.evidence}"` : ""}`),
      "",
      "</details>",
      ""
    );
  }

  return lines.join("\n");
}
