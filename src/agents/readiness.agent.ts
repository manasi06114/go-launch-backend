import { InternalMetrics, ReadinessInsight } from "../types/domain.js";

export class OrganizationalReadinessAgent {
  run(metrics: InternalMetrics): ReadinessInsight {
    const complexityPenalty = metrics.technicalComplexity === "high" ? 20 : metrics.technicalComplexity === "medium" ? 10 : 0;

    const score = Math.max(
      0,
      Math.min(
        100,
        25 +
          metrics.teamSize * 1.2 +
          metrics.runwayMonths * 2 +
          metrics.salesReadiness * 0.25 +
          metrics.opsReadiness * 0.25 -
          complexityPenalty -
          Math.max(0, 20 - metrics.expectedTimelineWeeks) * 0.8
      )
    );

    const strengths: string[] = [];
    const weakSpots: string[] = [];

    if (metrics.runwayMonths >= 12) strengths.push("Healthy financial runway");
    else weakSpots.push("Short runway can pressure go-to-market execution");

    if (metrics.salesReadiness >= 70) strengths.push("Sales readiness is strong");
    else weakSpots.push("Sales motion needs stronger validation and enablement");

    if (metrics.opsReadiness >= 70) strengths.push("Operational systems are mature");
    else weakSpots.push("Operational readiness is not yet robust");

    if (metrics.technicalComplexity === "high") weakSpots.push("High technical complexity increases delivery risk");

    return {
      readinessScore: score,
      strengths,
      weakSpots
    };
  }
}
