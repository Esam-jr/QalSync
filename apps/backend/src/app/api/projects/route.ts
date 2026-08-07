import { createRouteHandlerClient, getAuthenticatedUser } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }

    const supabase = createRouteHandlerClient(request);

    // Limit maximum rows scanned to guard server memory and network egress
    const { data, error } = await supabase
      .from("translations")
      .select("project_id")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      console.error("[QalSync] Failed to fetch project IDs:", error.message);
      return NextResponse.json(
        { error: "Failed to fetch project IDs" },
        { status: 500 }
      );
    }

    const projectSet = new Set<string>(["all", "default"]);
    if (data) {
      for (const row of data) {
        if (row.project_id && typeof row.project_id === "string") {
          const trimmed = row.project_id.trim();
          if (trimmed) {
            projectSet.add(trimmed);
          }
        }
      }
    }

    return NextResponse.json({ projects: Array.from(projectSet) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[QalSync] GET /api/projects error:", message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
