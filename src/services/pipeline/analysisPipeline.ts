import { v4 as uuidv4 } from "uuid";
import { MarketResearchAgent } from "../../agents/marketResearch.agent.js";
import { CompetitorAnalysisAgent } from "../../agents/competitorAnalysis.agent.js";
import { OrganizationalReadinessAgent } from "../../agents/readiness.agent.js";
import { RiskAgent } from "../../agents/risk.agent.js";
import { AnalysisRequest, WebDocument } from "../../types/domain.js";
import { EmbeddingService } from "../ai/embedding.service.js";
import { LlmService } from "../ai/llm.service.js";
import { MongoVectorStore } from "../vector/mongoVectorStore.js";
import { ScoringService } from "../scoring/scoring.service.js";
import { ReportBuilder } from "../report/reportBuilder.js";

export class AnalysisPipeline {
  private readonly marketAgent = new MarketResearchAgent();
  private readonly competitorAgent = new CompetitorAnalysisAgent();
  private readonly readinessAgent = new OrganizationalReadinessAgent();
  private readonly riskAgent = new RiskAgent();
  private readonly embeddingService = new EmbeddingService();
  private readonly llmService = new LlmService();
  private readonly vectorStore = new MongoVectorStore();
  private readonly scoringService = new ScoringService();
  private readonly reportBuilder = new ReportBuilder();

  async run(input: AnalysisRequest) {
    const requestId = uuidv4();

    const [marketResult, competitorResult] = await Promise.all([
      this.marketAgent.run(input.idea),
      this.competitorAgent.run(input.idea)
    ]);

    const readiness = this.readinessAgent.run(input.internalMetrics);
    const risk = this.riskAgent.run({
      metrics: input.internalMetrics,
      market: marketResult.signal,
      competition: competitorResult.insight,
      readiness
    });

    const mergedDocs = this.mergeDocs(marketResult.docs, competitorResult.docs);

    await this.indexDocuments(requestId, mergedDocs);
    const retrievedContext = await this.retrieveRelevantContext(
      requestId,
      `${input.idea.productName} ${input.idea.problemStatement} ${input.idea.proposedSolution}`
    );

    const scoring = this.scoringService.run({
      market: marketResult.signal,
      competition: competitorResult.insight,
      readiness,
      risk
    });

    const executiveSummary = await this.llmService.summarize(
      `Idea: ${input.idea.oneLiner}\nIndustry: ${input.idea.industry}\n` +
        `Market demand score: ${marketResult.signal.demandScore}\n` +
        `Competition saturation score: ${competitorResult.insight.saturationScore}\n` +
        `Readiness score: ${readiness.readinessScore}\nRisk score: ${risk.riskScore}\n` +
        `Retrieved external context:\n${retrievedContext.join("\n")}`
    );

    const investorNarrative = await this.llmService.summarize(
      `Create an investor-ready narrative with problem, solution, wedge, moat, GTM, and milestone ask.\n` +
        `Startup: ${input.idea.productName}. One-liner: ${input.idea.oneLiner}.\n` +
        `Differentiators: ${input.idea.differentiators.join(", ")}.\n` +
        `Scores: viability ${scoring.overallViabilityScore}, market ${scoring.marketAttractivenessScore}, risk ${scoring.executionRiskScore}.\n` +
        `Evidence:\n${retrievedContext.join("\n")}`
    );

    return this.reportBuilder.build({
      requestId,
      idea: input.idea,
      market: marketResult.signal,
      competition: competitorResult.insight,
      readiness,
      risk,
      scoring,
      executiveSummary,
      investorNarrative,
      retrievedSources: mergedDocs
    });
  }

  private mergeDocs(...docLists: WebDocument[][]): WebDocument[] {
    const byUrl = new Map<string, WebDocument>();
    for (const list of docLists) {
      for (const doc of list) {
        if (!byUrl.has(doc.url)) {
          byUrl.set(doc.url, doc);
        }
      }
    }
    return Array.from(byUrl.values());
  }

  private async indexDocuments(requestId: string, docs: WebDocument[]): Promise<void> {
    const records = await Promise.all(
      docs.slice(0, 20).map(async (doc, idx) => ({
        id: `${requestId}-${idx}-${doc.url}`,
        embedding: await this.embeddingService.embed(`${doc.title}\n${doc.snippet}\n${doc.content.slice(0, 2000)}`),
        metadata: {
          requestId,
          title: doc.title,
          url: doc.url,
          snippet: doc.snippet
        }
      }))
    );

    await this.vectorStore.upsert(records);
  }

  private async retrieveRelevantContext(requestId: string, query: string): Promise<string[]> {
    const embedding = await this.embeddingService.embed(query);
    const records = await this.vectorStore.query(embedding, 6, { requestId });
    return records.map((r) => `${r.metadata.title} | ${r.metadata.url} | ${r.metadata.snippet}`);
  }
}
