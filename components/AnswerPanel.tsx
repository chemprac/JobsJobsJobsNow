"use client";

import { useState } from "react";
import type { ApplicationAnswer, Job } from "@/lib/types";

async function readTextStream(response: Response, onChunk: (chunk: string) => void) {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    onChunk(await response.text());
    return;
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

export function AnswerPanel({ job, initialAnswers }: { job: Job; initialAnswers: ApplicationAnswer[] }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState(initialAnswers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateAnswer() {
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setAnswer("");
    let generated = "";

    try {
      const response = await fetch(`/api/jobs/${job.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, question })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Answer generation failed");
      }

      await readTextStream(response, (chunk) => {
        generated += chunk;
        setAnswer((current) => current + chunk);
      });

      setAnswers((current) => [
        {
          id: crypto.randomUUID(),
          job_id: job.id,
          question: question.trim(),
          answer: generated.trim(),
          created_at: new Date().toISOString()
        },
        ...current
      ]);
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Answer generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-app-border bg-app-card p-5">
      <h3 className="text-lg font-semibold">Answer a question</h3>
      <textarea
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        placeholder="Paste an application question here."
        className="mt-4 min-h-28 w-full rounded-xl border border-app-border bg-black/30 p-4 text-sm text-white outline-none ring-emerald-500 focus:ring-2"
      />
      <button
        onClick={generateAnswer}
        disabled={loading || !question.trim()}
        className="mt-3 w-full rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-60"
      >
        {loading ? "Generating..." : "Generate Answer"}
      </button>

      {error ? <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}

      {answer ? (
        <div className="mt-4 rounded-xl border border-app-border bg-black/30 p-4">
          <p className="whitespace-pre-wrap text-sm leading-6 text-neutral-100">{answer}</p>
          <button onClick={() => navigator.clipboard.writeText(answer)} className="mt-3 rounded-lg border border-app-border px-3 py-1 text-sm text-neutral-200">
            Copy
          </button>
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        <p className="text-sm font-semibold text-neutral-300">Previous answers</p>
        {answers.length === 0 ? <p className="text-sm text-neutral-500">No answers yet.</p> : null}
        {answers.map((item) => (
          <div key={item.id} className="rounded-xl border border-app-border bg-white/5 p-4">
            <p className="text-sm font-medium text-neutral-200">{item.question}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-400">{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
