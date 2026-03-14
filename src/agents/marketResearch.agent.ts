import { MarketSignal, StartupIdeaInput, WebDocument } from "../types/domain.js";
import { SearchClient } from "../services/research/searchClient.js";
import { ScraperService } from "../services/research/scraper.js";

export class MarketResearchAgent {
  constructor(private readonly searchClient = new SearchClient(), private readonly scraper = new ScraperService()) {}

  async run(idea: StartupIdeaInput): Promise<{ signal: MarketSignal; docs: WebDocument[] }> {
    const query = `${idea.industry} market size demand trends ${idea.targetAudience} ${idea.geographies.join(" ")}`;
    const searchResults = await this.searchClient.search(query);
    const docs = await this.scraper.scrapeMany(searchResults);

    const corpus = docs.map((d) => d.content.toLowerCase()).join(" ");
    const trendKeywords = ["growth", "expanding", "rising", "adoption", "increase", "high demand"];
    const trendHits = trendKeywords.filter((k) => corpus.includes(k));

    const demandScore = Math.min(100, 40 + trendHits.length * 8 + docs.length * 4);

    return {
      signal: {
        demandScore,
        trendSignals: trendHits.length > 0 ? trendHits : ["Limited explicit trend signals detected"],
        sourceCount: docs.length,
        evidence: docs.slice(0, 5).map((d) => `${d.title} (${d.url})`)
      },
      docs
    };
  }
}
