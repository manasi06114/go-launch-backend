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

  async searchMany(queries: string[], perQueryLimit = 3, overallLimit = Math.max(env.SEARCH_LIMIT * 3, 12)): Promise<SearchResult[]> {
    const settled = await Promise.allSettled(
      queries.map((query) => this.search(query, perQueryLimit))
    );

    const deduped = new Map<string, SearchResult>();
    for (const result of settled) {
      if (result.status !== "fulfilled") continue;

      for (const item of result.value) {
        if (!item.url || deduped.has(item.url)) continue;
        deduped.set(item.url, item);

        if (deduped.size >= overallLimit) {
          return Array.from(deduped.values());
        }
      }
    }

    return Array.from(deduped.values());
  }
}
