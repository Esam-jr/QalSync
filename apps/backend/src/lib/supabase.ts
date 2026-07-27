import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";

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
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables"
    );
  }

  return createSupabaseClient(url, key);
}

export function createRouteHandlerClient(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY!;

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // Cookie setting handled via response in middleware
      },
    },
  });
}

export async function getAuthenticatedUser(request: NextRequest) {
  // 1. Try SSR cookie session first
  const supabase = createRouteHandlerClient(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (user && !error) return user;

  // 2. Try Authorization: Bearer <access_token> header fallback
  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    const anonSupabase = createClient();
    const {
      data: { user: bearerUser },
      error: bearerError,
    } = await anonSupabase.auth.getUser(token);

    if (bearerUser && !bearerError) return bearerUser;
  }

  return null;
}
