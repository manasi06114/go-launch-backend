import { MarketSignal, StartupIdeaInput, WebDocument } from "../types/domain.js";
import { SearchClient } from "../services/research/searchClient.js";
import { ScraperService } from "../services/research/scraper.js";

function buildMarketQueries(idea: StartupIdeaInput): string[] {
  const geo = idea.geographies.join(" ");
  return [
    `${idea.industry} startup market size demand trends ${idea.targetAudience} ${geo}`,
    `${idea.problemStatement} customer pain points ${idea.targetAudience} ${geo}`,
    `${idea.productName} ${idea.proposedSolution} go to market strategy ${idea.industry}`,
    `site:quora.com ${idea.problemStatement} ${idea.targetAudience}`,
    `site:reddit.com ${idea.problemStatement} ${idea.targetAudience}`,
    `site:hubspot.com ${idea.industry} marketing strategy ${idea.targetAudience}`,
    `site:techcrunch.com ${idea.industry} startup trends ${geo}`,
    `site:producthunt.com ${idea.productName} ${idea.industry}`
  ];
}

function buildMarketSeedResults(idea: StartupIdeaInput): Array<{ title: string; url: string; snippet: string }> {
  const encodedIndustry = encodeURIComponent(idea.industry);
  const encodedAudience = encodeURIComponent(idea.targetAudience);

  return [
    {
      title: "Quora startup discussions",
      url: `https://www.quora.com/search?q=${encodedIndustry}%20${encodedAudience}`,
      snippet: "Founder discussions and pain points"
    },
    {
      title: "Reddit startups",
      url: "https://www.reddit.com/r/startups/",
      snippet: "Startup founder threads and market feedback"
    },
    {
      title: "TechCrunch startups",
      url: "https://techcrunch.com/category/startups/",
      snippet: "Startup market and funding trend coverage"
    },
    {
      title: "Product Hunt startup tools",
      url: "https://www.producthunt.com/topics/startup-tools",
      snippet: "Products launched for startup operators"
    },
    {
      title: "HubSpot startup marketing",
      url: "https://blog.hubspot.com/marketing",
      snippet: "Go-to-market and growth strategy content"
    }
  ];
}

function withSeedResults(
  searchResults: Array<{ title: string; url: string; snippet: string }>,
  seedResults: Array<{ title: string; url: string; snippet: string }>
): Array<{ title: string; url: string; snippet: string }> {
  const byUrl = new Map<string, { title: string; url: string; snippet: string }>();
  [...searchResults, ...seedResults].forEach((item) => {
    if (!item.url || byUrl.has(item.url)) return;
    byUrl.set(item.url, item);
  });

  return Array.from(byUrl.values());
}

export class MarketResearchAgent {
  constructor(private readonly searchClient = new SearchClient(), private readonly scraper = new ScraperService()) {}

  async run(idea: StartupIdeaInput): Promise<{ signal: MarketSignal; docs: WebDocument[] }> {
    const searchResults = await this.searchClient.searchMany(buildMarketQueries(idea));
    const docs = await this.scraper.scrapeMany(withSeedResults(searchResults, buildMarketSeedResults(idea)));

    const corpus = docs.map((d) => d.content.toLowerCase()).join(" ");
    const trendKeywords = ["growth", "expanding", "rising", "adoption", "increase", "high demand"];
    const trendHits = trendKeywords.filter((k) => corpus.includes(k));

    const demandScore = Math.min(100, 40 + trendHits.length * 8 + docs.length * 4);

    return {
      signal: {
        demandScore,
        trendSignals: trendHits.length > 0 ? trendHits : ["Limited explicit trend signals detected"],
        sourceCount: docs.length,
        evidence: docs.slice(0, 5).map((d) => `${d.title} (${d.domain})`)
      },
      docs
    };
  }
}
