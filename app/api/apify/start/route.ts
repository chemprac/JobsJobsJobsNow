import { NextResponse } from "next/server";
import { normalizeMaxItems, startApifyRunAsync } from "@/lib/apify";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { searchUrl?: string; maxItems?: number };
    const searchUrl = body.searchUrl?.trim();

    if (!searchUrl) {
      return NextResponse.json({ error: "LinkedIn search URL is required." }, { status: 400 });
    }

    const maxItems = normalizeMaxItems(body.maxItems);
    const runId = await startApifyRunAsync(searchUrl, maxItems);

    return NextResponse.json({ runId });
  } catch (error) {
    console.error("Apify start failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Apify start failed" },
      { status: 500 }
    );
  }
}
