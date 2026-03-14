export type SourcePlatform =
  | "quora"
  | "reddit"
  | "producthunt"
  | "g2"
  | "capterra"
  | "hubspot"
  | "techcrunch"
  | "crunchbase"
  | "medium"
  | "linkedin"
  | "generic";

export function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "unknown";
  }
}

export function detectSourcePlatform(domain: string): SourcePlatform {
  if (domain.includes("quora.com")) return "quora";
  if (domain.includes("reddit.com")) return "reddit";
  if (domain.includes("producthunt.com")) return "producthunt";
  if (domain.includes("g2.com")) return "g2";
  if (domain.includes("capterra.com")) return "capterra";
  if (domain.includes("hubspot.com")) return "hubspot";
  if (domain.includes("techcrunch.com")) return "techcrunch";
  if (domain.includes("crunchbase.com")) return "crunchbase";
  if (domain.includes("medium.com")) return "medium";
  if (domain.includes("linkedin.com")) return "linkedin";
  return "generic";
}