/**
 * HTML sanitization for user-generated text.
 * Strips all HTML tags to prevent stored XSS.
 *
 * Controls: PCI DSS 6.5.1, NIST SI-10, HITRUST 09.o
 */
const TAG_RE = /<[^>]*>/g;
const SCRIPT_RE = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

export function sanitizeText(input: string | null | undefined): string {
  if (!input) return "";
  return input.replace(SCRIPT_RE, "").replace(TAG_RE, "").trim();
}
