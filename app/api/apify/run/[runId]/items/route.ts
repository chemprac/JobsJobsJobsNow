import { NextResponse } from "next/server";
import { fetchApifyRunItems, getApifyRunStatus } from "@/lib/apify";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { runId: string } }) {
  try {
    const status = await getApifyRunStatus(params.runId);

    if (status !== "SUCCEEDED") {
      return NextResponse.json({ error: `Apify run is not ready (${status}).` }, { status: 409 });
    }

    const jobs = await fetchApifyRunItems(params.runId);
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Apify items fetch failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Apify items fetch failed" },
      { status: 500 }
    );
  }
}
