import { createRouteHandlerClient, getAuthenticatedUser } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required to view translations" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const locale = searchParams.get("locale");
    const status = searchParams.get("status");

    // Pagination params — safe-clamped to prevent abuse
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE), 10))
    );
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = createRouteHandlerClient(request);

    let query = supabase
      .from("translations")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (projectId) query = query.eq("project_id", projectId);
    if (locale) query = query.eq("locale", locale);
    if (status && status !== "all") query = query.eq("status", status);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch translations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      translations: data,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[QalSync] GET /api/translations error:", message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
