import axios from "axios";
import * as cheerio from "cheerio";
import { env } from "../../config/env.js";
import { sanitizeText, truncate } from "../etl/normalizer.js";
import { WebDocument } from "../../types/domain.js";
import { detectSourcePlatform, getDomainFromUrl } from "./sourceMetadata.js";

export class ScraperService {
  private buildFallbackDocument(url: string, title: string, snippet: string): WebDocument {
    const domain = getDomainFromUrl(url);

    return {
      title,
      url,
      snippet,
      domain,
      platform: detectSourcePlatform(domain),
      content: truncate(sanitizeText(`${title} ${snippet}`), 4000)
    };
  }

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
      const domain = getDomainFromUrl(url);

      return {
        title,
        url,
        snippet,
        domain,
        platform: detectSourcePlatform(domain),
        content: truncate(text, 15000)
      };
    } catch {
      return this.buildFallbackDocument(url, title, snippet);
    }
  }

  async scrapeMany(results: Array<{ title: string; url: string; snippet: string }>): Promise<WebDocument[]> {
    const docs = await Promise.all(results.map((r) => this.scrapePage(r.url, r.title, r.snippet)));
    return docs.filter((d): d is WebDocument => Boolean(d));
  }
}
