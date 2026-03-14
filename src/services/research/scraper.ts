import axios from "axios";
import * as cheerio from "cheerio";
import { env } from "../../config/env.js";
import { sanitizeText, truncate } from "../etl/normalizer.js";
import { WebDocument } from "../../types/domain.js";

export class ScraperService {
  async scrapePage(url: string, title: string, snippet: string): Promise<WebDocument | null> {
    try {
      const response = await axios.get<string>(url, {
        timeout: env.REQUEST_TIMEOUT_MS,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
        }
      });

      const $ = cheerio.load(response.data);
      $("script, style, noscript").remove();
      const text = sanitizeText($("body").text());

      return {
        title,
        url,
        snippet,
        content: truncate(text, 15000)
      };
    } catch {
      return null;
    }
  }

  async scrapeMany(results: Array<{ title: string; url: string; snippet: string }>): Promise<WebDocument[]> {
    const docs = await Promise.all(results.map((r) => this.scrapePage(r.url, r.title, r.snippet)));
    return docs.filter((d): d is WebDocument => Boolean(d));
  }
}
