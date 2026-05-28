import { CV_PROFILE } from "./cv-profile";
import { createChatCompletion } from "./openrouter";
import type { ApifyJob, MatchTier, ScoringResult } from "./types";

const SCORING_SYSTEM_PROMPT =
  "You are a precise job-CV match scorer. Return ONLY valid JSON, no markdown, no preamble.";

export function stripJsonFences(value: string) {
  return value
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export function fallbackScoringResult(): ScoringResult {
  return {
    score: 0,
    tier: "C",
    match_summary: "Scoring failed.",
    strengths: [],
    gaps: [],
    apply_recommendation: "No",
    cover_letter_angle: "",
    blocker: "Scoring failed"
  };
}

function tierFromScore(score: number): MatchTier {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  return "C";
}

function normalizeScoringResult(parsed: Partial<ScoringResult> & { score?: unknown; tier?: unknown }) {
  const rawScore = Number(parsed.score);
  const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(100, Math.round(rawScore))) : 0;
  const tier = parsed.tier === "A" || parsed.tier === "B" || parsed.tier === "C" ? parsed.tier : tierFromScore(score);

  return {
    score,
    tier,
    match_summary: String(parsed.match_summary ?? ""),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String) : [],
    apply_recommendation: String(parsed.apply_recommendation ?? "No"),
    cover_letter_angle: String(parsed.cover_letter_angle ?? ""),
    blocker: parsed.blocker ? String(parsed.blocker) : null
  } satisfies ScoringResult;
}

export async function scoreJob(job: ApifyJob): Promise<ScoringResult> {
  const userPrompt = `Score this job against this candidate. Return JSON only.

CANDIDATE:
${CV_PROFILE}

JOB:
Title: ${job.jobTitle ?? ""}
Company: ${job.companyName ?? ""}
Location: ${job.location ?? ""}
Sector: ${job.sector ?? ""}
Experience Level: ${job.experienceLevel ?? ""}

Description:
${(job.jobDescription ?? "").slice(0, 3000)}

Return exactly this JSON:
{
  "score": <integer 0-100>,
  "tier": <"A" if score>=80, "B" if score>=60, "C" if score<60>,
  "match_summary": "<2 sentences on why candidate fits>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "gaps": ["<gap 1>", "<gap 2>"],
  "apply_recommendation": "<Yes / Yes with caveats / No>",
  "cover_letter_angle": "<1 sentence: the best hook for a cover letter for this specific role>",
  "blocker": "<hard blocker e.g. language requirement, visa, degree mismatch — or null>"
}`;

  try {
    const content = await createChatCompletion({
      maxTokens: 800,
      messages: [
        { role: "system", content: SCORING_SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ]
    });

    return normalizeScoringResult(JSON.parse(stripJsonFences(content)));
  } catch (error) {
    console.error("OpenRouter scoring failed", error);
    return fallbackScoringResult();
  }
}

export function mapApifyJobToInsert(job: ApifyJob, scoring: ScoringResult) {
  return {
    job_id: job.jobId,
    job_title: job.jobTitle,
    company_name: job.companyName ?? null,
    location: job.location ?? null,
    job_url: job.jobUrl ?? null,
    apply_url: job.applyUrl ?? null,
    apply_type: job.applyType ?? null,
    company_url: job.companyUrl ?? null,
    company_logo: job.companyLogo ?? null,
    contract_type: job.contractType ?? null,
    experience_level: job.experienceLevel ?? null,
    work_type: job.workType ?? null,
    sector: job.sector ?? null,
    salary_info: job.salaryInfo ? JSON.stringify(job.salaryInfo) : null,
    applications_count: job.applicationsCount ?? null,
    posted_time: job.postedTime ?? null,
    published_at: job.publishedAt ?? null,
    job_description: job.jobDescription ?? null,
    poster_name: job.posterFullName ?? null,
    poster_profile_url: job.posterProfileUrl ?? null,
    search_string: job.searchString ?? null,
    match_score: scoring.score,
    match_tier: scoring.tier,
    match_summary: scoring.match_summary,
    strengths: JSON.stringify(scoring.strengths),
    gaps: JSON.stringify(scoring.gaps),
    apply_recommendation: scoring.apply_recommendation,
    cover_letter_angle: scoring.cover_letter_angle,
    blocker: scoring.blocker
  };
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
