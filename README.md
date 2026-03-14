# GoLaunch AI Backend (Express + TypeScript)

This backend implements a modular decision-intelligence pipeline for startup launch decisions.

## Implemented Capabilities

- API-first backend with validation, error handling, and request IDs
- Multi-agent analysis workflow:
	- Market Research Agent
	- Competitor Analysis Agent
	- Organizational Readiness Agent
	- Risk Agent
- Internet data gathering:
	- Search via DuckDuckGo (`duck-duck-scrape`)
	- Content scraping via `axios` + `cheerio`
- ETL and text normalization layer
- AI layer:
	- Gemini summaries and investor narrative generation
	- Gemini embeddings + semantic retrieval via MongoDB-backed vector records (RAG-style context fetch)
- Scoring engine:
	- Feasibility score
	- Market attractiveness score
	- Execution risk score
	- Overall viability score + recommendation
- Feedback loop endpoint that stores outcomes for future model recalibration

## Tech Stack

- Runtime: `express`, `cors`, `helmet`, `morgan`, `pino`, `pino-http`
- Validation: `zod`
- AI: `@google/generative-ai`
- Database: `mongodb`
- Search/Scraping: `duck-duck-scrape`, `axios`, `cheerio`
- Utilities: `uuid`, `dotenv`
- Tooling: `typescript`, `tsx`

## Project Structure

```text
src/
	agents/
	config/
	data/
	middlewares/
	routes/
	schemas/
	services/
		ai/
		etl/
		pipeline/
		report/
		research/
		scoring/
		vector/
	types/
	app.ts
	server.ts
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
PORT=8080
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=go_launch_ai
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
GEMINI_EMBEDDING_MODEL=text-embedding-004
SEARCH_LIMIT=5
REQUEST_TIMEOUT_MS=15000
ALLOWED_ORIGIN=http://localhost:5173
```

If `GEMINI_API_KEY` is empty, the backend still works with deterministic fallback summarization/embeddings.

## Run

```bash
npm install
npm run dev
```

Build and run production:

```bash
npm run build
npm start
```

Default URL: `http://localhost:8080`

## API Endpoints

- `GET /health`
- `POST /api/v1/analysis/report`
- `GET /api/v1/analysis/report/:requestId`
- `POST /api/v1/analysis/feedback`

## Generate Finalized Startup Report

### Request

`POST /api/v1/analysis/report`

```json
{
	"idea": {
		"productName": "GoLaunch AI",
		"oneLiner": "Decision intelligence for startup and enterprise product launches",
		"targetAudience": "startup founders and enterprise product managers",
		"industry": "SaaS",
		"geographies": ["US", "EU"],
		"problemStatement": "Teams struggle to decide whether to launch due to fragmented market data and weak internal readiness visibility.",
		"proposedSolution": "Unified AI platform that combines market demand signals, competitor intelligence, internal readiness, and risk scoring.",
		"differentiators": ["multi-agent intelligence", "RAG grounded outputs", "investor-ready narrative generation"]
	},
	"internalMetrics": {
		"teamSize": 12,
		"runwayMonths": 18,
		"budgetUsd": 250000,
		"expectedTimelineWeeks": 20,
		"technicalComplexity": "medium",
		"salesReadiness": 68,
		"opsReadiness": 72
	},
	"constraints": ["launch in 5 months", "must prioritize B2B segment first"]
}
```

### Response (Shape)

Returns a full report object containing:

- `executiveSummary`
- `market`
- `competition`
- `readiness`
- `risk`
- `scoring`
- `actionPlan`
- `investorNarrative`
- `rawSources`

## Feedback Loop

Use `POST /api/v1/analysis/feedback` to store post-launch outcomes and corrected scores.
Data is persisted to MongoDB collection `analysis_feedback`.

## MongoDB Collections

- `analysis_reports`: stores generated reports and source request payload
- `analysis_feedback`: stores post-launch corrections/outcomes
- `document_vectors`: stores embeddings and metadata used in retrieval
