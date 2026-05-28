import { NextResponse } from "next/server";
import { scrapeAndScoreJobs } from "@/lib/scrape-runner";

export const maxDuration = 300;

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await scrapeAndScoreJobs();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Scrape and score failed", error);
    return NextResponse.json({ error: "Scrape and score failed" }, { status: 500 });
  }
}
