import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";

function pseudoEmbedding(text: string, dims = 96): number[] {
  const out = new Array<number>(dims).fill(0);
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    out[i % dims] += ((code % 31) - 15) / 15;
  }
  return out;
}

export class EmbeddingService {
  private readonly client = env.GEMINI_API_KEY ? new GoogleGenerativeAI(env.GEMINI_API_KEY) : null;

  async embed(text: string): Promise<number[]> {
    if (!this.client) {
      return pseudoEmbedding(text);
    }

    try {
      const model = this.client.getGenerativeModel({ model: env.GEMINI_EMBEDDING_MODEL });
      const response = await model.embedContent(text);
      return response.embedding.values;
    } catch {
      return pseudoEmbedding(text);
    }
  }
}
