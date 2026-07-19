import { createClient, type TranslationRow } from "@/lib/supabase";
import { translateText } from "@/lib/gemini";
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, locale, projectId } = body as {
      text?: string;
      locale?: string;
      projectId?: string;
    };

    if (!text || !locale || !projectId) {
      return NextResponse.json(
        { error: "Missing required fields: text, locale, projectId" },
        { status: 400 }
      );
    }

    const sourceHash = createHash("sha256").update(text).digest("hex");
    const supabase = createClient();

    // Check for existing translation
    const { data: existing, error: lookupError } = await supabase
      .from("translations")
      .select("*")
      .eq("source_hash", sourceHash)
      .eq("locale", locale)
      .eq("project_id", projectId)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json(
        { error: "Database lookup failed", details: lookupError.message },
        { status: 500 }
      );
    }

    // Return cached translation
    if (existing) {
      const row = existing as unknown as TranslationRow;
      return NextResponse.json({
        translation: row.translation,
        reviewed: row.status === "approved",
        id: row.id,
      });
    }

    // No cached translation — call Gemini
    const translation = await translateText(text, locale);

    // Save as draft
    const { data: inserted, error: insertError } = await supabase
      .from("translations")
      .insert({
        source_text: text,
        source_hash: sourceHash,
        locale,
        translation,
        status: "draft",
        project_id: projectId,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to save translation", details: insertError.message },
        { status: 500 }
      );
    }

    const insertedRow = inserted as unknown as TranslationRow;
    return NextResponse.json({
      translation: insertedRow.translation,
      reviewed: false,
      id: insertedRow.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: message },
      { status: 500 }
    );
  }
}
