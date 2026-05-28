import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase";
import type { JobStatus } from "@/lib/types";

const STATUS_OPTIONS: JobStatus[] = ["new", "reviewing", "applied", "rejected", "interviewing"];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = (await request.json()) as {
    status?: JobStatus;
    applied?: boolean;
    notes?: string;
  };

  if (body.status && !STATUS_OPTIONS.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updates = {
    ...(body.status ? { status: body.status } : {}),
    ...(typeof body.applied === "boolean" ? { applied: body.applied, applied_at: body.applied ? new Date().toISOString() : null } : {}),
    ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
    updated_at: new Date().toISOString()
  };

  const supabase = getSupabaseService();
  const { data, error } = await supabase.from("jobs").update(updates).eq("id", params.id).select("*").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ job: data });
}
