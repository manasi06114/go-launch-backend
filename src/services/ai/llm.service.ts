import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";

export class LlmService {
  private readonly client = env.GEMINI_API_KEY ? new GoogleGenerativeAI(env.GEMINI_API_KEY) : null;

  async answerReportChat(input: {
    reportContext: string;
    history: Array<{ role: "user" | "assistant"; content: string }>;
    question: string;
  }): Promise<string> {
    const historyBlock = input.history
      .slice(-12)
      .map((item) => `${item.role === "user" ? "User" : "Analyst"}: ${item.content}`)
      .join("\n");

    const prompt =
      "You are a startup analyst assistant answering follow-up questions about one generated report. " +
      "Use plain language, direct answers, and practical next steps. " +
      "Avoid markdown headers, hashtags, and unnecessary bullets.\n\n" +
      `Report context:\n${input.reportContext}\n\n` +
      `Conversation so far:\n${historyBlock || "No prior messages."}\n\n` +
      `User question: ${input.question}\n\n` +
      "Answer in 3-6 short lines. If the question asks for actions, provide clear numbered steps.";

    const response = this.client ? await this.generate(prompt) : null;
    return (response || this.fallbackChatAnswer(input.question)).trim();
  }

  async summarizeExecutiveSummary(prompt: string): Promise<string> {
    const structuredPrompt =
      "Write an executive summary in exactly 5 concise points. " +
      "Use plain business language, human tone, and no AI-style filler. " +
      "Do not use markdown, hashtags, bullets, or dashes. " +
      "Return each point on a new line in this format: 1) ... 2) ... up to 5).\n\n" +
      prompt;

    const response = this.client
      ? await this.generate(structuredPrompt)
      : this.fallbackExecutiveSummary(prompt);

    return this.normalizeExecutiveSummary(response || this.fallbackExecutiveSummary(prompt));
  }

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

  private async generate(prompt: string): Promise<string | null> {
    try {
      if (!this.client) return null;

      const model = this.client.getGenerativeModel({ model: env.GEMINI_MODEL });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
        systemInstruction:
          "You are an expert venture analyst. Return concise, evidence-grounded summaries with practical recommendations."
      });

      return result.response.text() || null;
    } catch {
      return null;
    }
  }

  private normalizeExecutiveSummary(summary: string): string {
    const cleanedLines = summary
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^#+\s*/, ""))
      .map((line) => line.replace(/^[-*•]+\s*/, ""))
      .map((line) => line.replace(/^\d+[.):-]?\s*/, ""));

    const sentenceCandidates = cleanedLines.length
      ? cleanedLines
      : summary
          .replace(/[#*•-]/g, " ")
          .split(/[.!?]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 12);

    const points = sentenceCandidates.slice(0, 5);
    if (!points.length) {
      return this.fallbackExecutiveSummary(summary);
    }

    return points.map((point, idx) => `${idx + 1}) ${point.replace(/\s+/g, " ")}`).join("\n");
  }

  private fallbackExecutiveSummary(prompt: string): string {
    const compact = prompt.replace(/\s+/g, " ");
    const excerpt = compact.slice(0, 260);

    return [
      "1) Customer pain appears real, but problem clarity should be validated with targeted interviews.",
      "2) Early market indicators support testing a narrow segment before expanding scope.",
      "3) Competition pressure requires sharper differentiation around one high-value use case.",
      "4) Delivery risk can be reduced through phased milestones tied to adoption and retention.",
      `5) Immediate next step: run a focused MVP experiment based on this context: ${excerpt}.`
    ].join("\n");
  }

  private fallbackChatAnswer(question: string): string {
    const q = question.trim();
    return [
      `You asked: ${q}.`,
      "Based on the current report, focus first on validating demand in one narrow customer segment.",
      "Then test pricing and conversion assumptions with a lightweight MVP before scaling.",
      "If you share one metric goal, I can suggest a tighter execution plan."
    ].join("\n");
  }

  private fallbackSummary(prompt: string): string {
    const firstSentence = prompt.split(".")[0]?.slice(0, 280) ?? "";
    return `Automated synthesis: ${firstSentence}. The opportunity appears promising if the team validates demand quickly, narrows ICP focus, and de-risks execution through staged rollout milestones.`;
  }
}
