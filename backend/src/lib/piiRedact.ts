/**
 * PII Redaction Layer — GDPR compliance for cross-border AI provider transfers.
 *
 * Strips common PII patterns from text before sending to providers
 * in jurisdictions without EU adequacy decisions (e.g. DeepSeek → China).
 *
 * This is a best-effort scrub, not a guarantee. For full GDPR compliance,
 * avoid sending personal data to non-adequate jurisdictions entirely.
 */

/* ── Patterns ── */

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_RE = /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g;
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/g;
const CREDIT_CARD_RE = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
const IP_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const US_ADDRESS_RE = /\b\d{1,5}\s+[A-Za-z0-9\s,.#-]{5,60}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl|Circle|Cir)\b\.?/gi;

const PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: EMAIL_RE, label: "[EMAIL]" },
  { re: SSN_RE, label: "[SSN]" },
  { re: CREDIT_CARD_RE, label: "[CARD]" },
  { re: PHONE_RE, label: "[PHONE]" },
  { re: IP_RE, label: "[IP]" },
  { re: US_ADDRESS_RE, label: "[ADDRESS]" },
];

/**
 * Redact PII patterns from a single string.
 */
export function redactPii(text: string): string {
  let result = text;
  for (const { re, label } of PATTERNS) {
    result = result.replace(re, label);
  }
  return result;
}

/**
 * Redact PII from an array of chat messages (OpenAI-compatible format).
 * Returns a new array — does not mutate the original.
 * Preserves original types via generic constraint.
 */
export function redactMessages<T extends { content: string }>(
  messages: T[],
): T[] {
  return messages.map((m) => ({
    ...m,
    content: redactPii(m.content),
  }));
}
