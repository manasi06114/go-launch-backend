import { env } from "../../config/env.js";

export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

export class SearchClient {
  async search(query: string, limit = env.SEARCH_LIMIT): Promise<SearchResult[]> {
    try {
      const ddg = await import("duck-duck-scrape");
      const response = await ddg.search(query, {
        safeSearch: ddg.SafeSearchType.MODERATE
      });

      return (response.results ?? []).slice(0, limit).map((r: any) => ({
        title: r.title ?? "Untitled",
        url: r.url,
        snippet: r.description ?? ""
      }));
    } catch {
      return [];
    }
  }
}
