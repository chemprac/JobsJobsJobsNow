import Link from "next/link";
import type { Job } from "@/lib/types";

function scoreClass(score: number | null) {
  if ((score ?? 0) >= 80) return "bg-emerald-500 text-black";
  if ((score ?? 0) >= 60) return "bg-amber-500 text-black";
  return "bg-red-500 text-white";
}

export function JobCard({ job }: { job: Job }) {
  const initial = (job.company_name ?? job.job_title).charAt(0).toUpperCase();

  return (
    <article className="rounded-2xl border border-app-border bg-app-card p-5 shadow-2xl shadow-black/10 transition hover:border-emerald-500/50">
      <div className="flex gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-emerald-500/20">
          {job.company_logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.company_logo} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-emerald-300">{initial}</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">{job.job_title}</h2>
              <p className="mt-1 text-sm text-neutral-400">
                {job.company_name ?? "Unknown company"} {job.location ? `| ${job.location}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${scoreClass(job.match_score)}`}>{job.match_score ?? 0}</span>
              <span className="rounded-full border border-app-border px-3 py-1 text-sm text-neutral-300">Tier {job.match_tier ?? "C"}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {job.apply_recommendation ? (
              <span className="rounded-full bg-white/5 px-3 py-1 text-neutral-300">{job.apply_recommendation}</span>
            ) : null}
            {job.blocker ? <span className="rounded-full bg-red-500/15 px-3 py-1 text-red-300">{job.blocker}</span> : null}
            {job.posted_time ? <span className="rounded-full bg-white/5 px-3 py-1 text-neutral-400">{job.posted_time}</span> : null}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <span className="text-xs capitalize text-neutral-500">Status: {job.status}</span>
            <Link href={`/jobs/${job.id}`} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400">
              View Details
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
