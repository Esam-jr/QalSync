import { createRouteHandlerClient, getAuthenticatedUser } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required to update translations" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { translation, status } = body as {
      translation?: string;
      status?: "approved" | "draft";
    };

    if (!translation && !status) {
      return NextResponse.json(
        { error: "Provide at least one of: translation, status" },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient(request);

    const update: Record<string, string> = {};
    if (translation !== undefined) update.translation = translation;
    if (status !== undefined) update.status = status;

    const { data, error } = await supabase
      .from("translations")
      .update(update as Record<string, unknown>)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update translation", details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Translation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ translation: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required to delete translations" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabase = createRouteHandlerClient(request);

    const { data, error } = await supabase
      .from("translations")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete translation", details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Translation not found or permission denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: message },
      { status: 500 }
    );
  }
}


