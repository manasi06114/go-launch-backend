import { CompetitorInsight, InternalMetrics, MarketSignal, ReadinessInsight, RiskInsight } from "../types/domain.js";

export class RiskAgent {
  run(input: {
    metrics: InternalMetrics;
    market: MarketSignal;
    competition: CompetitorInsight;
    readiness: ReadinessInsight;
  }): RiskInsight {
    const categories: RiskInsight["categories"] = [];

    const marketLevel = input.market.demandScore < 45 ? "high" : input.market.demandScore < 65 ? "medium" : "low";
    categories.push({
      category: "market-demand",
      level: marketLevel,
      reason: `Demand score is ${input.market.demandScore.toFixed(1)}`
    });

    const competitionLevel = input.competition.saturationScore > 75 ? "high" : input.competition.saturationScore > 50 ? "medium" : "low";
    categories.push({
      category: "competitive-pressure",
      level: competitionLevel,
      reason: `Saturation score is ${input.competition.saturationScore.toFixed(1)}`
    });

    const executionLevel =
      input.readiness.readinessScore < 45 || input.metrics.technicalComplexity === "high"
        ? "high"
        : input.readiness.readinessScore < 70
          ? "medium"
          : "low";
    categories.push({
      category: "execution-readiness",
      level: executionLevel,
      reason: `Readiness score is ${input.readiness.readinessScore.toFixed(1)} with ${input.metrics.technicalComplexity} complexity`
    });

    const levelWeight = { low: 20, medium: 55, high: 85 };
    const riskScore = Math.round(categories.reduce((acc, item) => acc + levelWeight[item.level], 0) / categories.length);

    return {
      riskScore,
      categories,
      topRisks: categories.filter((c) => c.level !== "low").map((c) => `${c.category}: ${c.reason}`)
    };
  }
}
