export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

type StreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

function getOpenRouterApiKey() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY.");
  }

  return apiKey;
}

function openRouterHeaders() {
  return {
    Authorization: `Bearer ${getOpenRouterApiKey()}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    "X-Title": "Job Scout"
  };
}

export async function createChatCompletion({
  messages,
  maxTokens,
  model
}: {
  messages: ChatMessage[];
  maxTokens: number;
  model: string;
}) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: openRouterHeaders(),
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens
    })
  });

  const payload = (await response.json()) as ChatCompletionResponse;

  if (!response.ok) {
    const message =
      payload.error?.message ??
      (payload as { error?: string }).error ??
      `OpenRouter request failed with ${response.status}.`;
    throw new Error(typeof message === "string" ? message : `OpenRouter request failed with ${response.status}.`);
  }

  const content = payload.choices?.[0]?.message?.content?.trim() ?? "";
  if (!content) {
    throw new Error("OpenRouter returned an empty response.");
  }

  return content;
}

export async function streamChatCompletionText({
  messages,
  maxTokens,
  model,
  onText
}: {
  messages: ChatMessage[];
  maxTokens: number;
  model: string;
  onText: (text: string) => void;
}) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: openRouterHeaders(),
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      stream: true
    })
  });

  if (!response.ok || !response.body) {
    const payload = (await response.json().catch(() => null)) as ChatCompletionResponse | null;
    throw new Error(payload?.error?.message ?? `OpenRouter stream failed with ${response.status}.`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;

      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;

      const chunk = JSON.parse(data) as StreamChunk;
      const text = chunk.choices?.[0]?.delta?.content;

      if (text) {
        onText(text);
      }
    }
  }
}
