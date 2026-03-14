import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";

export class LlmService {
  private readonly client = env.GEMINI_API_KEY ? new GoogleGenerativeAI(env.GEMINI_API_KEY) : null;

  async summarize(prompt: string): Promise<string> {
    if (!this.client) {
      return this.fallbackSummary(prompt);
    }

    try {
      const model = this.client.getGenerativeModel({ model: env.GEMINI_MODEL });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
        systemInstruction:
          "You are an expert venture analyst. Return concise, evidence-grounded summaries with practical recommendations."
      });

      return result.response.text() || this.fallbackSummary(prompt);
    } catch {
      return this.fallbackSummary(prompt);
    }
  }

  private fallbackSummary(prompt: string): string {
    const firstSentence = prompt.split(".")[0]?.slice(0, 280) ?? "";
    return `Automated synthesis: ${firstSentence}. The opportunity appears promising if the team validates demand quickly, narrows ICP focus, and de-risks execution through staged rollout milestones.`;
  }
}
