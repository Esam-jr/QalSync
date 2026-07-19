import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export type TranslationRow = {
  id: string;
  source_text: string;
  source_hash: string;
  locale: string;
  translation: string | null;
  status: "draft" | "approved";
  project_id: string;
  created_at: string;
  updated_at: string;
};

export function createClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables"
    );
  }

  return createSupabaseClient(url, key);
}
