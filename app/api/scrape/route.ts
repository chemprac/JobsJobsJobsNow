import { NextResponse } from "next/server";
import { normalizeMaxItems, APIFY_DEFAULT_MAX_ITEMS } from "@/lib/apify";
import { scrapeAndScoreJobs } from "@/lib/scrape-runner";

export const maxDuration = 300;

function scrapeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Manual scrape failed";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { searchUrl?: string; maxItems?: number };
    const searchUrl = body.searchUrl?.trim();

    if (!searchUrl) {
      return NextResponse.json({ error: "LinkedIn search URL is required." }, { status: 400 });
    }

    let maxItems: number;
    try {
      maxItems = normalizeMaxItems(body.maxItems ?? APIFY_DEFAULT_MAX_ITEMS);
    } catch (validationError) {
      return NextResponse.json(
        { error: validationError instanceof Error ? validationError.message : "Invalid max jobs value." },
        { status: 400 }
      );
    }

    const summary = await scrapeAndScoreJobs(searchUrl, maxItems);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Manual scrape failed", error);
    return NextResponse.json({ error: scrapeErrorMessage(error) }, { status: 500 });
  }
}
