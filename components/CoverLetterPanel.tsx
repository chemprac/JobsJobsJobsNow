"use client";

import { useState } from "react";
import type { Job } from "@/lib/types";

async function readTextStream(response: Response, onChunk: (chunk: string) => void) {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    const text = await response.text();
    onChunk(text);
    return;
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

export function CoverLetterPanel({ job, onGenerated }: { job: Job; onGenerated: (coverLetter: string) => void }) {
  const [coverLetter, setCoverLetter] = useState(job.cover_letter ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = coverLetter.trim() ? coverLetter.trim().split(/\s+/).length : 0;

  async function generateCoverLetter() {
    setLoading(true);
    setError(null);
    setCoverLetter("");
    let generated = "";

    try {
      const response = await fetch(`/api/jobs/${job.id}/cover-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Cover letter generation failed");
      }

      await readTextStream(response, (chunk) => {
        generated += chunk;
        setCoverLetter((current) => current + chunk);
      });
      onGenerated(generated.trim());
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Cover letter generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function copyCoverLetter() {
    await navigator.clipboard.writeText(coverLetter);
  }

  return (
    <section className="rounded-2xl border border-app-border bg-app-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Cover letter</h3>
        <button
          onClick={generateCoverLetter}
          disabled={loading}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {coverLetter ? "Regenerate" : loading ? "Generating..." : "Generate"}
        </button>
      </div>

      {error ? <p className="mb-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}

      <textarea
        value={coverLetter}
        onChange={(event) => setCoverLetter(event.target.value)}
        placeholder="Generated cover letter will stream here."
        className="min-h-56 w-full rounded-xl border border-app-border bg-black/30 p-4 text-sm leading-6 text-white outline-none ring-emerald-500 focus:ring-2"
      />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-neutral-500">{wordCount} words</span>
        <button onClick={copyCoverLetter} disabled={!coverLetter} className="rounded-xl border border-app-border px-4 py-2 text-sm text-neutral-200 hover:bg-white/10">
          Copy
        </button>
      </div>
    </section>
  );
}
