import { NextResponse } from "next/server";
import { getSupabaseAnon } from "@/lib/supabase";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseAnon();

  const { data: job, error: jobError } = await supabase.from("jobs").select("*").eq("id", params.id).single();

  if (jobError) {
    return NextResponse.json({ error: jobError.message }, { status: 404 });
  }

  const { data: answers, error: answersError } = await supabase
    .from("application_answers")
    .select("*")
    .eq("job_id", params.id)
    .order("created_at", { ascending: false });

  if (answersError) {
    return NextResponse.json({ error: answersError.message }, { status: 500 });
  }

  return NextResponse.json({ job, answers: answers ?? [] });
}
