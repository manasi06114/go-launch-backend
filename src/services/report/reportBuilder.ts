import { AnalysisCharts, AnalysisReport, CompetitorInsight, MarketSignal, ReadinessInsight, RiskInsight, ScoringOutput, SourceReference, StartupIdeaInput, WebDocument } from "../../types/domain.js";

export class ReportBuilder {
  build(input: {
    requestId: string;
    idea: StartupIdeaInput;
    market: MarketSignal;
    competition: CompetitorInsight;
    readiness: ReadinessInsight;
    risk: RiskInsight;
    scoring: ScoringOutput;
    executiveSummary: string;
    investorNarrative: string;
    retrievedSources: WebDocument[];
  }): AnalysisReport {
    const actionPlan = this.makeActionPlan(input.market, input.competition, input.readiness, input.risk, input.scoring);
    const sources = this.makeSources(input.retrievedSources);
    const charts = this.makeCharts(input.market, input.competition, input.readiness, input.risk, input.scoring, sources);

    return {
      requestId: input.requestId,
      generatedAt: new Date().toISOString(),
      idea: input.idea,
      executiveSummary: input.executiveSummary,
      market: input.market,
      competition: input.competition,
      readiness: input.readiness,
      risk: input.risk,
      scoring: input.scoring,
      charts,
      actionPlan,
      investorNarrative: input.investorNarrative,
      sources,
      rawSources: sources.map((source) => source.url)
    };
  }

  private makeSources(docs: WebDocument[]): SourceReference[] {
    const byUrl = new Map<string, SourceReference>();

    for (const doc of docs) {
      if (byUrl.has(doc.url)) continue;
      byUrl.set(doc.url, {
        title: doc.title,
        url: doc.url,
        domain: doc.domain,
        platform: doc.platform,
        snippet: doc.snippet
      });
    }

    return Array.from(byUrl.values()).sort((left, right) => left.domain.localeCompare(right.domain));
  }

  private makeCharts(
    market: MarketSignal,
    competition: CompetitorInsight,
    readiness: ReadinessInsight,
    risk: RiskInsight,
    scoring: ScoringOutput,
    sources: SourceReference[]
  ): AnalysisCharts {
    const sourceMap = new Map<string, number>();
    for (const source of sources) {
      sourceMap.set(source.domain, (sourceMap.get(source.domain) ?? 0) + 1);
    }

    const scoreBreakdown: AnalysisCharts["scoreBreakdown"] = [
      { metric: "Viability", score: scoring.overallViabilityScore },
      { metric: "Feasibility", score: scoring.feasibilityScore },
      { metric: "Market", score: scoring.marketAttractivenessScore },
      { metric: "Risk", score: scoring.executionRiskScore }
    ];

    const radarMetrics: AnalysisCharts["radarMetrics"] = [
      { metric: "Demand", score: market.demandScore },
      { metric: "Readiness", score: readiness.readinessScore },
      { metric: "Defensibility", score: Math.max(0, 100 - competition.saturationScore) },
      { metric: "Feasibility", score: scoring.feasibilityScore },
      { metric: "Viability", score: scoring.overallViabilityScore }
    ];

    const trendProjection: AnalysisCharts["trendProjection"] = [
      {
        phase: "Discovery",
        demand: Math.max(0, market.demandScore - 16),
        competition: Math.max(0, competition.saturationScore - 8),
        risk: Math.min(100, risk.riskScore + 10)
      },
      {
        phase: "Validation",
        demand: Math.max(0, market.demandScore - 8),
        competition: competition.saturationScore,
        risk: risk.riskScore
      },
      {
        phase: "Launch",
        demand: market.demandScore,
        competition: Math.min(100, competition.saturationScore + 4),
        risk: Math.max(0, risk.riskScore - 4)
      },
      {
        phase: "Scale",
        demand: Math.min(100, market.demandScore + 6),
        competition: Math.min(100, competition.saturationScore + 10),
        risk: Math.max(0, risk.riskScore - 10)
      }
    ];

    const riskDistribution: AnalysisCharts["riskDistribution"] = risk.categories.map((item) => ({
      category: item.category,
      score: item.level === "high" ? 85 : item.level === "medium" ? 55 : 20
    }));

    const sourceDistribution: AnalysisCharts["sourceDistribution"] = Array.from(sourceMap.entries()).map(([domain, count]) => ({
      domain,
      count
    }));

    return {
      scoreBreakdown,
      radarMetrics,
      trendProjection,
      riskDistribution,
      sourceDistribution
    };
  }

  private makeActionPlan(
    market: MarketSignal,
    competition: CompetitorInsight,
    readiness: ReadinessInsight,
    risk: RiskInsight,
    scoring: ScoringOutput
  ): string[] {
    const steps: string[] = [];

    if (market.demandScore < 60) {
      steps.push("Run 10-20 customer discovery interviews and test pricing before full build.");
    } else {
      steps.push("Launch a focused MVP to validate conversion and retention in the first target segment.");
    }

    if (competition.saturationScore > 70) {
      steps.push("Refine positioning around one high-pain niche where incumbents underperform.");
    }

    if (readiness.readinessScore < 65) {
      steps.push("Close readiness gaps by assigning owners for sales enablement, delivery, and support ops.");
    }

    if (risk.riskScore >= 60) {
      steps.push("Use phase gates with go/no-go checkpoints tied to demand, CAC, and delivery milestones.");
    }

    steps.push(
      `Current recommendation: ${scoring.recommendation}. Target a viability score above 75 by reducing top risks and proving early traction metrics.`
    );

    return steps;
  }
}
