import { createClient, getAuthenticatedUser } from "@/lib/supabase";
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

    const supabase = createClient();

    const { data, error } = await supabase
      .from("translations")
      .select("project_id");



    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch project IDs", details: error.message },
        { status: 500 }
      );
    }

    const projectSet = new Set<string>(["all", "default"]);
    if (data) {
      for (const row of data) {
        if (row.project_id) projectSet.add(row.project_id);
      }
    }

    return NextResponse.json({ projects: Array.from(projectSet) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: message },
      { status: 500 }
    );
  }
}
