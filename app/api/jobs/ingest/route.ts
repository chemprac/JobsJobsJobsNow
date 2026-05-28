import { NextResponse } from "next/server";
import { ingestSingleJob } from "@/lib/scrape-runner";
import type { ApifyJob } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { job?: ApifyJob };

    if (!body.job) {
      return NextResponse.json({ error: "Job payload is required." }, { status: 400 });
    }

    const result = await ingestSingleJob(body.job);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Job ingest failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Job ingest failed" },
      { status: 500 }
    );
  }
}
