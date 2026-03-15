import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { AnalysisReport } from "../../types/domain.js";

type Slide = {
  title: string;
  subtitle?: string;
  bullets?: string[];
};

function cleanPoint(text: string): string {
  return text
    .replace(/^\d+[.):-]?\s*/, "")
    .replace(/^[-*•]+\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toPoints(text: string, max = 5): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => cleanPoint(line))
    .filter(Boolean);

  if (lines.length > 1) return lines.slice(0, max);

  const sentences = text
    .split(/[.!?]+/)
    .map((line) => cleanPoint(line))
    .filter((line) => line.length > 10);

  return sentences.slice(0, max);
}

function wrapTextByWidth(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const out: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      line = candidate;
      continue;
    }

    if (!line) {
      out.push(candidate);
      line = "";
      continue;
    }

    if (line) out.push(line);
    line = word;
  }

  if (line) out.push(line);
  return out;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-z0-9-_]+/gi, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function makeSlides(report: AnalysisReport): Slide[] {
  const executivePoints = toPoints(report.executiveSummary, 5);
  const narrativePoints = toPoints(report.investorNarrative, 6);
  const actionPoints = report.actionPlan.map(cleanPoint).filter(Boolean).slice(0, 5);

  return [
    {
      title: report.idea.productName,
      subtitle: "Pitch Deck"
    },
    {
      title: "Problem",
      bullets: [report.idea.problemStatement, `Target audience: ${report.idea.targetAudience}`]
    },
    {
      title: "Solution",
      bullets: [report.idea.proposedSolution, `One-liner: ${report.idea.oneLiner}`]
    },
    {
      title: "Market Opportunity",
      bullets: [
        `Industry: ${report.idea.industry}`,
        `Geographies: ${report.idea.geographies.join(", ")}`,
        `Demand score: ${report.market.demandScore}/100`,
        ...report.market.trendSignals.slice(0, 2).map((item) => `Signal: ${item}`)
      ]
    },
    {
      title: "Competition and Positioning",
      bullets: [
        `Competition saturation: ${report.competition.saturationScore}/100`,
        ...report.competition.positioningGaps.slice(0, 3)
      ]
    },
    {
      title: "Execution Readiness and Risk",
      bullets: [
        `Readiness score: ${report.readiness.readinessScore}/100`,
        `Risk score: ${report.risk.riskScore}/100`,
        ...report.risk.topRisks.slice(0, 3)
      ]
    },
    {
      title: "Executive Summary",
      bullets: executivePoints
    },
    {
      title: "Go-to-Market and Milestones",
      bullets: [...actionPoints, ...narrativePoints.slice(0, 2)]
    },
    {
      title: "Sources",
      bullets: report.sourceWebsites.slice(0, 6).map((item) => `${item.domain} (${item.websiteUrl})`)
    }
  ];
}

export class PitchDeckBuilder {
  async build(report: AnalysisReport): Promise<{ fileName: string; bytes: Uint8Array }> {
    const pdfDoc = await PDFDocument.create();
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const slides = makeSlides(report);

    for (const slide of slides) {
      const page = pdfDoc.addPage([1280, 720]);
      const { width, height } = page.getSize();
      const headerHeight = 92;
      const contentLeft = 86;
      const contentRight = width - 86;
      const bulletTextX = contentLeft + 32;
      const bulletMarkerX = contentLeft;
      const bodyFontSize = 18;
      const bodyLineHeight = 26;
      const bulletGap = 10;
      const contentTop = height - headerHeight - 62;
      const contentBottom = 86;

      page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.97, 0.97, 0.98) });
      page.drawRectangle({ x: 0, y: height - headerHeight, width, height: headerHeight, color: rgb(0.11, 0.12, 0.16) });

      page.drawText(slide.title, {
        x: contentLeft,
        y: height - 56,
        size: 34,
        font: titleFont,
        color: rgb(1, 1, 1)
      });

      if (slide.subtitle) {
        page.drawText(slide.subtitle, {
          x: contentLeft,
          y: height - headerHeight - 24,
          size: 22,
          font: bodyFont,
          color: rgb(0.2, 0.2, 0.26)
        });
      }

      const bullets = slide.bullets ?? [];
      let y = contentTop;

      for (const bullet of bullets) {
        if (y < contentBottom) break;

        const lines = wrapTextByWidth(cleanPoint(bullet), bodyFont, bodyFontSize, contentRight - bulletTextX);
        const requiredHeight = lines.length * bodyLineHeight + bulletGap;
        if (y - requiredHeight < contentBottom) {
          break;
        }

        page.drawText("-", {
          x: bulletMarkerX,
          y,
          size: bodyFontSize,
          font: titleFont,
          color: rgb(0.2, 0.23, 0.29)
        });

        for (const line of lines) {
          page.drawText(line, {
            x: bulletTextX,
            y,
            size: bodyFontSize,
            font: bodyFont,
            color: rgb(0.18, 0.18, 0.22)
          });
          y -= bodyLineHeight;
        }

        y -= bulletGap;
      }

      page.drawText(`${report.idea.productName} | ${new Date(report.generatedAt).toLocaleDateString("en-US")}`, {
        x: contentLeft,
        y: 36,
        size: 13,
        font: bodyFont,
        color: rgb(0.4, 0.4, 0.45)
      });
    }

    const bytes = await pdfDoc.save();
    const safeName = sanitizeFileName(report.idea.productName || "pitch_deck");
    return {
      fileName: `${safeName}_pitch_deck.pdf`,
      bytes
    };
  }
}
