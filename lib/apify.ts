import type { ApifyJob } from "./types";

const APIFY_BASE_URL = "https://api.apify.com/v2";

export function normalizeApifyActorId(value: string) {
  const trimmed = value.trim();
  const consoleMatch = trimmed.match(/actors\/([^/?#]+)/i);

  if (consoleMatch) {
    return consoleMatch[1];
  }

  return trimmed
    .replace(/^https?:\/\/api\.apify\.com\/v2\/acts\//i, "")
    .replace(/\/run-sync-get-dataset-items.*$/i, "")
    .replace(/\/$/, "");
}

function getApifyConfig() {
  const token = process.env.APIFY_API_TOKEN;
  const actorId = process.env.APIFY_ACTOR_ID ? normalizeApifyActorId(process.env.APIFY_ACTOR_ID) : "";

  if (!token || !actorId) {
    throw new Error("Missing Apify environment variables.");
  }

  return { token, actorId };
}

async function readApifyError(response: Response) {
  const text = await response.text();

  try {
    const payload = JSON.parse(text) as { error?: { message?: string } };
    return payload.error?.message ?? text.slice(0, 200);
  } catch {
    return text.slice(0, 200) || `HTTP ${response.status}`;
  }
}

export async function triggerApifyRun() {
  const { token, actorId } = getApifyConfig();
  const url = `${APIFY_BASE_URL}/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${token}`;
  const response = await fetch(url, { method: "POST", cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Apify run failed: ${await readApifyError(response)}`);
  }

  return (await response.json()) as ApifyJob[];
}

export async function fetchLatestApifyDataset(limit = 200) {
  const { token } = getApifyConfig();
  const params = new URLSearchParams({
    token,
    format: "json",
    limit: String(limit)
  });
  const url = `${APIFY_BASE_URL}/actor-runs/last/dataset/items?${params.toString()}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Apify dataset fetch failed: ${await readApifyError(response)}`);
  }

  return (await response.json()) as ApifyJob[];
}
