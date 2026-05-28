import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseService();
  const { data, error } = await supabase
    .from("jobs")
    .select("scraped_at")
    .order("scraped_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ last_scraped: data?.scraped_at ?? null });
}
