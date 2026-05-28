import { createClient } from "@supabase/supabase-js";
import type { ApplicationAnswer, Job } from "./types";

type Database = {
  public: {
    Tables: {
      jobs: {
        Row: Job;
        Insert: Partial<Job>;
        Update: Partial<Job>;
        Relationships: [];
      };
      application_answers: {
        Row: ApplicationAnswer;
        Insert: Partial<ApplicationAnswer>;
        Update: Partial<ApplicationAnswer>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};

function readEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function assertSupabaseUrl(url: string) {
  if (!url || url.includes("your_supabase")) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL. Set it in Vercel to https://your-project.supabase.co");
  }

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL: "${url}". Use https://your-project.supabase.co`);
  }

  return url;
}

function getSupabaseConfig(requireServiceRole = false) {
  const url = assertSupabaseUrl(readEnv("NEXT_PUBLIC_SUPABASE_URL"));
  const anonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!anonKey || anonKey.includes("your_supabase")) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  if (requireServiceRole && (!serviceRoleKey || serviceRoleKey.includes("your_service"))) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return { url, anonKey, serviceRoleKey };
}

export function getSupabaseAnon() {
  const { url, anonKey } = getSupabaseConfig();
  return createClient<Database>(url, anonKey);
}

export function getSupabaseService() {
  const { url, serviceRoleKey } = getSupabaseConfig(true);
  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
