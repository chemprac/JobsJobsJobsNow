import type { ApifyJob } from "./types";

const APIFY_BASE_URL = "https://api.apify.com/v2";

function getApifyConfig() {
  const token = process.env.APIFY_API_TOKEN;
  const actorId = process.env.APIFY_ACTOR_ID;

  if (!token || !actorId) {
    throw new Error("Missing Apify environment variables.");
  }

  return { token, actorId };
}

export async function triggerApifyRun() {
  const { token, actorId } = getApifyConfig();
  const url = `${APIFY_BASE_URL}/acts/${actorId}/run-sync-get-dataset-items?token=${token}`;
  const response = await fetch(url, { method: "POST", cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Apify run failed with ${response.status}.`);
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
    throw new Error(`Apify dataset fetch failed with ${response.status}.`);
  }

  return (await response.json()) as ApifyJob[];
}
