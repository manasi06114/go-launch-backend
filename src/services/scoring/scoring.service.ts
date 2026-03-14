import { CompetitorInsight, MarketSignal, ReadinessInsight, RiskInsight, ScoringOutput } from "../../types/domain.js";

export class ScoringService {
  run(input: {
    market: MarketSignal;
    competition: CompetitorInsight;
    readiness: ReadinessInsight;
    risk: RiskInsight;
  }): ScoringOutput {
    const marketAttractivenessScore = Math.round((input.market.demandScore + (100 - input.competition.saturationScore)) / 2);
    const feasibilityScore = Math.round((input.readiness.readinessScore * 0.6 + marketAttractivenessScore * 0.4));
    const executionRiskScore = input.risk.riskScore;

    const overallViabilityScore = Math.max(
      0,
      Math.min(100, Math.round(feasibilityScore * 0.55 + marketAttractivenessScore * 0.25 + (100 - executionRiskScore) * 0.2))
    );

    const recommendation: ScoringOutput["recommendation"] =
      overallViabilityScore >= 70
        ? "launch"
        : overallViabilityScore >= 50
          ? "launch-with-caution"
          : "do-not-launch";

    return {
      feasibilityScore,
      marketAttractivenessScore,
      executionRiskScore,
      overallViabilityScore,
      recommendation
    };
  }
}
