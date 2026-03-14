import { CompetitorInsight, StartupIdeaInput, WebDocument } from "../types/domain.js";
import { SearchClient } from "../services/research/searchClient.js";
import { ScraperService } from "../services/research/scraper.js";

function buildCompetitorQueries(idea: StartupIdeaInput): string[] {
  return [
    `${idea.productName} alternatives competitors in ${idea.industry}`,
    `${idea.proposedSolution} competitors for ${idea.targetAudience}`,
    `${idea.problemStatement} software alternatives ${idea.industry}`,
    `site:g2.com ${idea.productName} alternatives`,
    `site:capterra.com ${idea.industry} software ${idea.targetAudience}`,
    `site:producthunt.com ${idea.proposedSolution} ${idea.industry}`,
    `site:crunchbase.com ${idea.industry} startups ${idea.targetAudience}`,
    `site:linkedin.com companies ${idea.industry} ${idea.targetAudience}`
  ];
}

function guessCompetitorNames(docs: WebDocument[]): string[] {
  const names = new Set<string>();
  for (const doc of docs) {
    const matches = doc.title.match(/([A-Z][a-zA-Z0-9]+(?:\s[A-Z][a-zA-Z0-9]+){0,2})/g) ?? [];
    matches.slice(0, 2).forEach((m) => names.add(m));
  }
  return Array.from(names).slice(0, 8);
}

export class CompetitorAnalysisAgent {
  constructor(private readonly searchClient = new SearchClient(), private readonly scraper = new ScraperService()) {}

  async run(idea: StartupIdeaInput): Promise<{ insight: CompetitorInsight; docs: WebDocument[] }> {
    const searchResults = await this.searchClient.searchMany(buildCompetitorQueries(idea));
    const docs = await this.scraper.scrapeMany(searchResults);

    const competitorNames = guessCompetitorNames(docs);
    const competitorCount = Math.max(competitorNames.length, docs.length);
    const saturationScore = Math.min(100, 20 + competitorCount * 8);

    const positioningGaps = [
      `Niche targeting for ${idea.targetAudience}`,
      "Faster implementation and lower onboarding friction",
      "Operational transparency and measurable ROI"
    ];

    return {
      insight: {
        competitorCount,
        saturationScore,
        notableCompetitors: competitorNames,
        positioningGaps,
        evidence: docs.slice(0, 5).map((d) => `${d.title} (${d.domain})`)
      },
      docs
    };
  }
}
