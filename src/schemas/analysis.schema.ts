import { z } from "zod";

const internalMetricsSchema = z.object({
  teamSize: z.number().int().min(1).max(5000),
  runwayMonths: z.number().min(0).max(120),
  budgetUsd: z.number().min(0),
  expectedTimelineWeeks: z.number().min(1).max(520),
  technicalComplexity: z.enum(["low", "medium", "high"]),
  salesReadiness: z.number().min(0).max(100),
  opsReadiness: z.number().min(0).max(100)
});

const ideaSchema = z.object({
  productName: z.string().min(2),
  oneLiner: z.string().min(5),
  targetAudience: z.string().min(3),
  industry: z.string().min(2),
  geographies: z.array(z.string().min(2)).min(1),
  problemStatement: z.string().min(20),
  proposedSolution: z.string().min(20),
  differentiators: z.array(z.string().min(2)).default([])
});

export const analysisRequestSchema = z.object({
  idea: ideaSchema,
  internalMetrics: internalMetricsSchema,
  constraints: z.array(z.string().min(2)).optional()
});

export const feedbackSchema = z.object({
  requestId: z.string().min(3),
  launched: z.boolean(),
  outcome: z.enum(["success", "partial", "failure"]),
  notes: z.string().optional(),
  correctedScores: z
    .object({
      viability: z.number().min(0).max(100).optional(),
      risk: z.number().min(0).max(100).optional()
    })
    .optional()
});

export const reportChatSchema = z.object({
  requestId: z.string().min(3),
  message: z.string().min(2).max(2000)
});

export type AnalysisRequestDto = z.infer<typeof analysisRequestSchema>;
export type FeedbackDto = z.infer<typeof feedbackSchema>;
export type ReportChatDto = z.infer<typeof reportChatSchema>;
