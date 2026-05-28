"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { JobCard } from "@/components/JobCard";
import { Sidebar } from "@/components/Sidebar";
import type { Job } from "@/lib/types";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [tier, setTier] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (tier) params.set("tier", tier);
    if (status) params.set("status", status);
    if (search.trim()) params.set("search", search.trim());

    try {
      const [response, allResponse] = await Promise.all([
        fetch(`/api/jobs?${params.toString()}`, { cache: "no-store" }),
        fetch("/api/jobs", { cache: "no-store" })
      ]);
      const [payload, allPayload] = await Promise.all([response.json(), allResponse.json()]);

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load jobs");
      }

      if (!allResponse.ok) {
        throw new Error(allPayload.error ?? "Failed to load jobs");
      }

      setJobs(payload.jobs ?? []);
      setAllJobs(allPayload.jobs ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [search, status, tier]);

  useEffect(() => {
    const timeout = window.setTimeout(loadJobs, 250);
    return () => window.clearTimeout(timeout);
  }, [loadJobs]);

  const stats = useMemo(
    () => ({
      total: allJobs.length,
      tierA: allJobs.filter((job) => job.match_tier === "A").length,
      tierB: allJobs.filter((job) => job.match_tier === "B").length,
      applied: allJobs.filter((job) => job.applied || job.status === "applied").length,
      interviewing: allJobs.filter((job) => job.status === "interviewing").length
    }),
    [allJobs]
  );

  const lastScraped = useMemo(() => {
    return allJobs.map((job) => job.scraped_at).filter(Boolean).sort().at(-1) ?? null;
  }, [allJobs]);

  async function scrapeNow() {
    setIsScraping(true);
    setError(null);

    try {
      const response = await fetch("/api/scrape", { method: "POST" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Scrape failed");
      }

      await loadJobs();
    } catch (scrapeError) {
      setError(scrapeError instanceof Error ? scrapeError.message : "Scrape failed");
    } finally {
      setIsScraping(false);
    }
  }

  return (
    <main className="min-h-screen bg-app-background text-white lg:flex">
      <Sidebar
        stats={stats}
        tier={tier}
        status={status}
        search={search}
        lastScraped={lastScraped}
        isScraping={isScraping}
        onTierChange={setTier}
        onStatusChange={setStatus}
        onSearchChange={setSearch}
        onScrape={scrapeNow}
      />

      <section className="flex-1 p-6 lg:p-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-emerald-400">Ranked by OpenRouter against your CV</p>
            <h2 className="mt-2 text-3xl font-bold">Best matches</h2>
          </div>
          <p className="text-sm text-neutral-500">{loading ? "Loading..." : `${jobs.length} jobs shown`}</p>
        </div>

        {error ? <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}

        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>

        {!loading && jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-app-border p-10 text-center text-neutral-400">
            No jobs yet. Run a scrape to populate the dashboard.
          </div>
        ) : null}
      </section>
    </main>
  );
}
