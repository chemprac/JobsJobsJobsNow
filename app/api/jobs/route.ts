import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase";
import type { JobStatus, MatchTier } from "@/lib/types";

const statuses: JobStatus[] = ["new", "reviewing", "applied", "rejected", "interviewing"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tier = searchParams.get("tier") as MatchTier | null;
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const supabase = getSupabaseService();

  let query = supabase.from("jobs").select("*");

  if (tier && ["A", "B", "C"].includes(tier)) {
    query = query.eq("match_tier", tier);
  }

  if (status && statuses.includes(status as JobStatus)) {
    query = query.eq("status", status as JobStatus);
  }

  if (search?.trim()) {
    const term = search.trim().replaceAll(",", " ");
    query = query.or(`job_title.ilike.%${term}%,company_name.ilike.%${term}%`);
  }

  const { data, error } = await query
    .order("match_score", { ascending: false, nullsFirst: false })
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ jobs: data ?? [] });
}
