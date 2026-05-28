import { NextResponse } from "next/server";
import { getApifyRunStatus } from "@/lib/apify";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { runId: string } }) {
  try {
    const status = await getApifyRunStatus(params.runId);
    return NextResponse.json({ status });
  } catch (error) {
    console.error("Apify status failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Apify status failed" },
      { status: 500 }
    );
  }
}
