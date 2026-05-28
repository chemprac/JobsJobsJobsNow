import { WRITING_MODEL } from "@/lib/anthropic";
import { COVER_LETTER_RULES, CV_PROFILE } from "@/lib/cv-profile";
import { streamChatCompletionText } from "@/lib/openrouter";
import { getSupabaseService } from "@/lib/supabase";

const encoder = new TextEncoder();

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = (await request.json().catch(() => ({}))) as { jobId?: string };
  const jobId = body.jobId ?? params.id;
  const supabase = getSupabaseService();
  const { data: job, error } = await supabase.from("jobs").select("*").eq("id", jobId).single();

  if (error || !job) {
    return Response.json({ error: error?.message ?? "Job not found" }, { status: 404 });
  }

  const userPrompt = `Write a cover letter for this role.

MY PROFILE:
${CV_PROFILE}

JOB:
Title: ${job.job_title}
Company: ${job.company_name ?? ""}
Description: ${(job.job_description ?? "").slice(0, 2000)}

COVER LETTER ANGLE (use this as the hook):
${job.cover_letter_angle ?? ""}`;

  const stream = new ReadableStream({
    async start(controller) {
      let coverLetter = "";

      try {
        await streamChatCompletionText({
          model: WRITING_MODEL,
          maxTokens: 500,
          messages: [
            {
              role: "system",
              content: `You write cover letters for Angkan Mukherjee. Follow these rules exactly:
${COVER_LETTER_RULES}
- No "I am writing to apply" or similar`
            },
            { role: "user", content: userPrompt }
          ],
          onText: (text) => {
            coverLetter += text;
            controller.enqueue(encoder.encode(text));
          }
        });

        await supabase
          .from("jobs")
          .update({
            cover_letter: coverLetter.trim(),
            cover_letter_generated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", jobId);

        controller.close();
      } catch (streamError) {
        console.error("Cover letter generation failed", streamError);
        controller.error(streamError);
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
