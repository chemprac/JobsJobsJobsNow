"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnswerPanel } from "./AnswerPanel";
import { CoverLetterPanel } from "./CoverLetterPanel";
import type { ApplicationAnswer, Job, JobStatus } from "@/lib/types";

const statusOptions: JobStatus[] = ["new", "reviewing", "applied", "rejected", "interviewing"];

function parseList(value: string | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return value.split("\n").filter(Boolean);
  }
}

function scoreClass(score: number | null) {
  if ((score ?? 0) >= 80) return "bg-emerald-500 text-black";
  if ((score ?? 0) >= 60) return "bg-amber-500 text-black";
  return "bg-red-500 text-white";
}

export function JobDetail({ id }: { id: string }) {
  const [job, setJob] = useState<Job | null>(null);
  const [answers, setAnswers] = useState<ApplicationAnswer[]>([]);
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadJob() {
      setLoading(true);
      const response = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Failed to load job");
        setLoading(false);
        return;
      }

      setJob(payload.job);
      setAnswers(payload.answers ?? []);
      setNotes(payload.job.notes ?? "");
      setLoading(false);
    }

    loadJob();
  }, [id]);

  const strengths = useMemo(() => parseList(job?.strengths ?? null), [job?.strengths]);
  const gaps = useMemo(() => parseList(job?.gaps ?? null), [job?.gaps]);

  async function updateJob(updates: { status?: JobStatus; applied?: boolean; notes?: string }) {
    if (!job) return;

    const response = await fetch(`/api/jobs/${job.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    const payload = await response.json();

    if (response.ok) {
      setJob(payload.job);
      setNotes(payload.job.notes ?? "");
    } else {
      setError(payload.error ?? "Failed to update job");
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-app-background p-10 text-neutral-400">Loading job...</main>;
  }

  if (!job) {
    return <main className="min-h-screen bg-app-background p-10 text-red-200">{error ?? "Job not found"}</main>;
  }

  return (
    <main className="min-h-screen bg-app-background p-6 text-white lg:p-10">
      <Link href="/" className="text-sm text-emerald-400 hover:text-emerald-300">
        Back to dashboard
      </Link>

      {error ? <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(360px,2fr)]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-app-border bg-app-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{job.job_title}</h1>
                <p className="mt-2 text-neutral-400">
                  {job.company_name ?? "Unknown company"} {job.location ? `| ${job.location}` : ""}
                </p>
                <p className="mt-1 text-sm text-neutral-500">{job.sector}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-2xl px-5 py-3 text-2xl font-bold ${scoreClass(job.match_score)}`}>{job.match_score ?? 0}</span>
                <span className="rounded-2xl border border-app-border px-5 py-3 text-xl font-semibold">Tier {job.match_tier ?? "C"}</span>
              </div>
            </div>

            {job.match_summary ? <p className="mt-6 leading-7 text-neutral-200">{job.match_summary}</p> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <h2 className="font-semibold text-emerald-300">Strengths</h2>
              <ul className="mt-3 space-y-2 text-sm text-neutral-200">
                {strengths.map((strength) => (
                  <li key={strength} className="flex gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <h2 className="font-semibold text-amber-300">Gaps</h2>
              <ul className="mt-3 space-y-2 text-sm text-neutral-200">
                {gaps.map((gap) => (
                  <li key={gap} className="flex gap-2">
                    <span className="text-amber-400">!</span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {job.blocker ? <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">Blocker: {job.blocker}</div> : null}

          {job.cover_letter_angle ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 italic text-emerald-100">{job.cover_letter_angle}</div>
          ) : null}

          <div className="rounded-2xl border border-app-border bg-app-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Job description</h2>
              <button onClick={() => setExpanded((current) => !current)} className="text-sm text-emerald-400">
                {expanded ? "Collapse" : "Expand"}
              </button>
            </div>
            <div className={`overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-neutral-300 ${expanded ? "max-h-none" : "max-h-96"}`}>
              {job.job_description}
            </div>
          </div>

          <div className="grid gap-4 rounded-2xl border border-app-border bg-app-card p-5 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm text-neutral-400">Status</span>
              <select
                value={job.status}
                onChange={(event) => updateJob({ status: event.target.value as JobStatus })}
                className="w-full rounded-xl border border-app-border bg-black/30 px-4 py-3 text-white"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <button onClick={() => updateJob({ status: "applied", applied: true })} className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-black">
                Mark as Applied
              </button>
            </div>

            <label className="md:col-span-2">
              <span className="mb-2 block text-sm text-neutral-400">Notes</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                onBlur={() => updateJob({ notes })}
                className="min-h-32 w-full rounded-xl border border-app-border bg-black/30 p-4 text-white outline-none ring-emerald-500 focus:ring-2"
              />
            </label>
          </div>
        </section>

        <aside className="space-y-6">
          <CoverLetterPanel job={job} onGenerated={(coverLetter) => setJob({ ...job, cover_letter: coverLetter })} />
          <AnswerPanel job={job} initialAnswers={answers} />
          {job.apply_url ? (
            <a href={job.apply_url} target="_blank" rel="noreferrer" className="block rounded-2xl bg-white px-5 py-4 text-center font-semibold text-black hover:bg-emerald-400">
              Open Application
            </a>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
