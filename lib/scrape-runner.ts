import { triggerApifyRun } from "./apify";
import { mapApifyJobToInsert, scoreJob } from "./scoring";
import { getSupabaseService } from "./supabase";
import type { ApifyJob } from "./types";

export type ScrapeSummary = {
  processed: number;
  skipped: number;
  errors: number;
};

export type IngestResult = "processed" | "skipped" | "error";

export async function ingestSingleJob(job: ApifyJob): Promise<IngestResult> {
  const supabase = getSupabaseService();

  if (!job.jobId || !job.jobTitle || !job.jobDescription?.trim()) {
    return "skipped";
  }

  try {
    const { data: existing, error: lookupError } = await supabase
      .from("jobs")
      .select("id, blocker")
      .eq("job_id", job.jobId)
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    if (existing && existing.blocker !== "Scoring failed") {
      return "skipped";
    }

    const scoring = await scoreJob(job);
    const row = mapApifyJobToInsert(job, scoring);

    if (existing) {
      const { error: updateError } = await supabase.from("jobs").update(row).eq("id", existing.id);

      if (updateError) {
        throw updateError;
      }

      return "processed";
    }

    const { error: insertError } = await supabase.from("jobs").insert(row);

    if (insertError) {
      throw insertError;
    }

    return "processed";
  } catch (error) {
    console.error("Failed to ingest job", job.jobId, error);
    return "error";
  }
}

export async function scrapeAndScoreJobs(searchUrl: string, maxItems: number): Promise<ScrapeSummary> {
  const jobs = await triggerApifyRun(searchUrl, maxItems);
  const summary: ScrapeSummary = { processed: 0, skipped: 0, errors: 0 };

  for (const job of jobs) {
    const result = await ingestSingleJob(job);
    summary[result === "error" ? "errors" : result === "processed" ? "processed" : "skipped"] += 1;
  }

  return summary;
}
