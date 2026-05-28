import { CV_PROFILE } from "@/lib/cv-profile";
import { streamChatCompletionText } from "@/lib/openrouter";
import { getSupabaseService } from "@/lib/supabase";

const encoder = new TextEncoder();

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = (await request.json()) as { jobId?: string; question?: string };
  const jobId = body.jobId ?? params.id;

  if (!body.question?.trim()) {
    return Response.json({ error: "Question is required" }, { status: 400 });
  }

  const question = body.question.trim();
  const supabase = getSupabaseService();
  const { data: job, error } = await supabase.from("jobs").select("*").eq("id", jobId).single();

  if (error || !job) {
    return Response.json({ error: error?.message ?? "Job not found" }, { status: 404 });
  }

  const userPrompt = `Answer this application question.

MY PROFILE:
${CV_PROFILE}

JOB:
Title: ${job.job_title}
Company: ${job.company_name ?? ""}
Description: ${(job.job_description ?? "").slice(0, 1500)}

QUESTION:
${question}`;

  const stream = new ReadableStream({
    async start(controller) {
      let answer = "";

      try {
        await streamChatCompletionText({
          maxTokens: 700,
          messages: [
            {
              role: "system",
              content:
                "You answer job application questions for Angkan Mukherjee. Be direct and concrete. Use numbers where possible. No filler. Match the tone to the question. Stay within any word/character limit if specified."
            },
            { role: "user", content: userPrompt }
          ],
          onText: (text) => {
            answer += text;
            controller.enqueue(encoder.encode(text));
          }
        });

        await supabase.from("application_answers").insert({
          job_id: jobId,
          question,
          answer: answer.trim()
        });

        controller.close();
      } catch (streamError) {
        console.error("Answer generation failed", streamError);
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
