import { NextResponse } from "next/server";
import { scrapeAndScoreJobs } from "@/lib/scrape-runner";

export const maxDuration = 300;

function scrapeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Manual scrape failed";
}

export async function POST() {
  try {
    const summary = await scrapeAndScoreJobs();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Manual scrape failed", error);
    return NextResponse.json({ error: scrapeErrorMessage(error) }, { status: 500 });
  }
}
