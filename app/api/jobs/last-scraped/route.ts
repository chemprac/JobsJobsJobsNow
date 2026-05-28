import { NextResponse } from "next/server";
import { getSupabaseAnon } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type LastScrapedRow = {
  last_scraped: string | null;
};

export async function GET() {
  const supabase = getSupabaseAnon();
  const { data, error } = await supabase.from("jobs").select("last_scraped:scraped_at.max()");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ last_scraped: (data as unknown as LastScrapedRow[] | null)?.[0]?.last_scraped ?? null });
}
