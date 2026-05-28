import { NextResponse } from "next/server";
import { scrapeAndScoreJobs } from "@/lib/scrape-runner";

export const maxDuration = 300;

export async function POST() {
  try {
    const summary = await scrapeAndScoreJobs();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Manual scrape failed", error);
    return NextResponse.json({ error: "Manual scrape failed" }, { status: 500 });
  }
}
