import { z } from "zod";

export const FindingSchema = z.object({
  claim: z.string().describe("The exact claim or statement from the target content, quoted or closely paraphrased."),
  status: z.enum(["supported", "contradicted", "unverifiable"]),
  evidence: z
    .string()
    .nullable()
    .describe("A direct quote from the source-of-truth that supports or contradicts the claim. Null if unverifiable."),
  severity: z.enum(["critical", "high", "medium", "low"]),
  reasoning: z.string().describe("One sentence: why this severity, and what a reader should do about it."),
});

export const AuditResultSchema = z.object({
  findings: z.array(FindingSchema),
});

// Hand-mirrored JSON Schema for the Anthropic tool_use input_schema.
// Kept in sync manually with FindingSchema above (no zod-to-json-schema
// dependency, since this is one small object and not worth a library).
export const AUDIT_TOOL_INPUT_SCHEMA = {
  type: "object",
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          claim: { type: "string" },
          status: { type: "string", enum: ["supported", "contradicted", "unverifiable"] },
          evidence: { type: ["string", "null"] },
          severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
          reasoning: { type: "string" },
        },
        required: ["claim", "status", "evidence", "severity", "reasoning"],
      },
    },
  },
  required: ["findings"],
};
