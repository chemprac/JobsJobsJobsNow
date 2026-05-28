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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function getSupabaseAnon() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseService() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
