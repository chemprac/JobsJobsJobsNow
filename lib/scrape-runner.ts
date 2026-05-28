import { triggerApifyRun } from "./apify";
import { delay, mapApifyJobToInsert, scoreJob } from "./scoring";
import { getSupabaseService } from "./supabase";

export type ScrapeSummary = {
  processed: number;
  skipped: number;
  errors: number;
};

export async function scrapeAndScoreJobs(searchUrl: string, maxItems: number): Promise<ScrapeSummary> {
  const supabase = getSupabaseService();
  const jobs = await triggerApifyRun(searchUrl, maxItems);
  const summary: ScrapeSummary = { processed: 0, skipped: 0, errors: 0 };

  for (const job of jobs) {
    try {
      if (!job.jobId || !job.jobTitle || !job.jobDescription?.trim()) {
        summary.skipped += 1;
        continue;
      }

      const { data: existing, error: lookupError } = await supabase
        .from("jobs")
        .select("id, blocker")
        .eq("job_id", job.jobId)
        .maybeSingle();

      if (lookupError) {
        throw lookupError;
      }

      if (existing && existing.blocker !== "Scoring failed") {
        summary.skipped += 1;
        continue;
      }

      const scoring = await scoreJob(job);
      const row = mapApifyJobToInsert(job, scoring);

      if (existing) {
        const { error: updateError } = await supabase.from("jobs").update(row).eq("id", existing.id);

        if (updateError) {
          throw updateError;
        }

        summary.processed += 1;
        await delay(500);
        continue;
      }

      const { error: insertError } = await supabase.from("jobs").insert(row);

      if (insertError) {
        throw insertError;
      }

      summary.processed += 1;
      await delay(500);
    } catch (error) {
      console.error("Failed to process job", job.jobId, error);
      summary.errors += 1;
    }
  }

  return summary;
}
