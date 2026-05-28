"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { JobCard } from "@/components/JobCard";
import { Sidebar } from "@/components/Sidebar";
import { APIFY_DEFAULT_MAX_ITEMS, DEFAULT_LINKEDIN_SEARCH_URL } from "@/lib/apify";
import type { ApifyJob, Job } from "@/lib/types";

const SEARCH_URL_STORAGE_KEY = "jobScoutSearchUrl";
const MAX_ITEMS_STORAGE_KEY = "jobScoutMaxItems";

type IngestPayload = {
  result?: "processed" | "skipped" | "error";
  error?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForApifyRun(runId: string, onProgress: (message: string) => void) {
  const finished = new Set(["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"]);

  while (true) {
    const response = await fetch(`/api/apify/run/${runId}`, { cache: "no-store" });
    const payload = await readApiPayload<{ status?: string; error?: string }>(response);

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to check Apify run status");
    }

    const status = payload.status ?? "UNKNOWN";
    onProgress(`LinkedIn scrape: ${status.toLowerCase()}...`);

    if (status === "SUCCEEDED") {
      return;
    }

    if (finished.has(status) && status !== "SUCCEEDED") {
      throw new Error(`Apify run failed with status ${status}`);
    }

    await sleep(5000);
  }
}

type LastScrapedPayload = {
  last_scraped: string | null;
  error?: string;
};

async function readApiPayload<T extends { error?: string }>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return { error: text.slice(0, 200) || `Request failed with status ${response.status}` } as T;
  }
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [tier, setTier] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchUrl, setSearchUrl] = useState(DEFAULT_LINKEDIN_SEARCH_URL);
  const [maxItems, setMaxItems] = useState(APIFY_DEFAULT_MAX_ITEMS);
  const [loading, setLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapeMessage, setScrapeMessage] = useState<string | null>(null);
  const [lastScraped, setLastScraped] = useState<string | null>(null);

  useEffect(() => {
    const savedUrl = window.localStorage.getItem(SEARCH_URL_STORAGE_KEY);
    const savedMaxItems = window.localStorage.getItem(MAX_ITEMS_STORAGE_KEY);

    if (savedUrl) {
      setSearchUrl(savedUrl);
    }

    if (savedMaxItems) {
      const parsed = Number(savedMaxItems);
      if (Number.isFinite(parsed)) {
        setMaxItems(parsed);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SEARCH_URL_STORAGE_KEY, searchUrl);
  }, [searchUrl]);

  useEffect(() => {
    window.localStorage.setItem(MAX_ITEMS_STORAGE_KEY, String(maxItems));
  }, [maxItems]);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (tier) params.set("tier", tier);
    if (status) params.set("status", status);
    if (search.trim()) params.set("search", search.trim());

    try {
      const [response, allResponse, lastScrapedResponse] = await Promise.all([
        fetch(`/api/jobs?${params.toString()}`, { cache: "no-store" }),
        fetch("/api/jobs", { cache: "no-store" }),
        fetch("/api/jobs/last-scraped", { cache: "no-store" })
      ]);
      const [payload, allPayload, lastScrapedPayload] = await Promise.all([
        readApiPayload<{ jobs?: Job[]; error?: string }>(response),
        readApiPayload<{ jobs?: Job[]; error?: string }>(allResponse),
        readApiPayload<LastScrapedPayload>(lastScrapedResponse)
      ]);

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load jobs");
      }

      if (!allResponse.ok) {
        throw new Error(allPayload.error ?? "Failed to load jobs");
      }

      if (!lastScrapedResponse.ok) {
        throw new Error(lastScrapedPayload.error ?? "Failed to load last scraped timestamp");
      }

      setJobs(payload.jobs ?? []);
      setAllJobs(allPayload.jobs ?? []);
      setLastScraped(lastScrapedPayload.last_scraped);
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

  async function scrapeNow() {
    setIsScraping(true);
    setError(null);
    setScrapeMessage(null);

    const summary = { processed: 0, skipped: 0, errors: 0 };

    try {
      setScrapeMessage("Starting LinkedIn scrape...");

      const startResponse = await fetch("/api/apify/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchUrl: searchUrl.trim(), maxItems })
      });
      const startPayload = await readApiPayload<{ runId?: string; error?: string }>(startResponse);

      if (!startResponse.ok || !startPayload.runId) {
        throw new Error(startPayload.error ?? "Failed to start Apify scrape");
      }

      await waitForApifyRun(startPayload.runId, setScrapeMessage);

      setScrapeMessage("Fetching scraped jobs...");
      const itemsResponse = await fetch(`/api/apify/run/${startPayload.runId}/items`, { cache: "no-store" });
      const itemsPayload = await readApiPayload<{ jobs?: ApifyJob[]; error?: string }>(itemsResponse);

      if (!itemsResponse.ok) {
        throw new Error(itemsPayload.error ?? "Failed to fetch scraped jobs");
      }

      const scrapedJobs = itemsPayload.jobs ?? [];

      for (let index = 0; index < scrapedJobs.length; index += 1) {
        setScrapeMessage(`Scoring job ${index + 1} of ${scrapedJobs.length}...`);

        const ingestResponse = await fetch("/api/jobs/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job: scrapedJobs[index] })
        });
        const ingestPayload = await readApiPayload<IngestPayload>(ingestResponse);

        if (!ingestResponse.ok) {
          summary.errors += 1;
          continue;
        }

        if (ingestPayload.result === "processed") {
          summary.processed += 1;
        } else if (ingestPayload.result === "skipped") {
          summary.skipped += 1;
        } else {
          summary.errors += 1;
        }

        await sleep(300);
      }

      setScrapeMessage(`Added ${summary.processed} jobs. Skipped ${summary.skipped}. Errors ${summary.errors}.`);
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
        searchUrl={searchUrl}
        maxItems={maxItems}
        lastScraped={lastScraped}
        isScraping={isScraping}
        scrapeProgress={isScraping ? scrapeMessage : null}
        onTierChange={setTier}
        onStatusChange={setStatus}
        onSearchChange={setSearch}
        onSearchUrlChange={setSearchUrl}
        onMaxItemsChange={setMaxItems}
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
        {scrapeMessage ? <div className="mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">{scrapeMessage}</div> : null}

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
