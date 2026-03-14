export function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

export function truncate(input: string, maxChars: number): string {
  if (input.length <= maxChars) {
    return input;
  }
  return `${input.slice(0, maxChars)}...`;
}

export function sanitizeText(input: string): string {
  return normalizeWhitespace(input.replace(/[\u0000-\u001F]+/g, " "));
}
