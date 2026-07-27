import { createRouteHandlerClient, getAuthenticatedUser } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

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

    const supabase = createRouteHandlerClient(request);

    let query = supabase
      .from("translations")
      .select("*")
      .order("created_at", { ascending: false });




    if (projectId) query = query.eq("project_id", projectId);
    if (locale) query = query.eq("locale", locale);
    if (status && status !== "all") query = query.eq("status", status);


    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch translations", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ translations: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: message },
      { status: 500 }
    );
  }
}
