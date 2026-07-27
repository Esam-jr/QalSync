import { createClient, getAuthenticatedUser, type TranslationRow } from "@/lib/supabase";
import { translateText, translateBatchText } from "@/lib/gemini";
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const { text, texts, locale, projectId } = body as {
      text?: string;
      texts?: string[];
      locale?: string;
      projectId?: string;
    };

    if (!locale || !projectId) {
      return NextResponse.json(
        { error: "Missing required fields: locale and projectId" },
        { status: 400 }
      );
    }

    if (!text && (!texts || !Array.isArray(texts) || texts.length === 0)) {
      return NextResponse.json(
        { error: "Provide either 'text' (string) or 'texts' (non-empty array of strings)" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // ── Single Text Translation Request ──
    if (text) {
      const sourceHash = createHash("sha256").update(text).digest("hex");

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

      if (existing) {
        const row = existing as unknown as TranslationRow;
        return NextResponse.json({
          translation: row.translation,
          reviewed: row.status === "approved",
          id: row.id,
        });
      }

      const translation = await translateText(text, locale);

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
    }

    // ── Batch Texts Translation Request ──
    const uniqueTexts = Array.from(new Set(texts!));
    const textHashMap = new Map<string, string>();
    uniqueTexts.forEach((t) => {
      textHashMap.set(t, createHash("sha256").update(t).digest("hex"));
    });

    const hashes = Array.from(textHashMap.values());

    const { data: existingRows, error: batchLookupError } = await supabase
      .from("translations")
      .select("*")
      .in("source_hash", hashes)
      .eq("locale", locale)
      .eq("project_id", projectId);

    if (batchLookupError) {
      return NextResponse.json(
        { error: "Database batch lookup failed", details: batchLookupError.message },
        { status: 500 }
      );
    }

    const resultMap: Record<
      string,
      { translation: string; reviewed: boolean; id: string }
    > = {};

    const cachedHashSet = new Set<string>();

    if (existingRows) {
      for (const rawRow of existingRows) {
        const row = rawRow as unknown as TranslationRow;
        cachedHashSet.add(row.source_hash);
        resultMap[row.source_text] = {
          translation: row.translation ?? row.source_text,
          reviewed: row.status === "approved",
          id: row.id,
        };
      }
    }

    // Identify uncached texts
    const uncachedTexts = uniqueTexts.filter(
      (t) => !cachedHashSet.has(textHashMap.get(t)!)
    );

    if (uncachedTexts.length > 0) {
      const generatedMap = await translateBatchText(uncachedTexts, locale);

      const rowsToInsert = uncachedTexts.map((t) => ({
        source_text: t,
        source_hash: textHashMap.get(t)!,
        locale,
        translation: generatedMap[t] ?? t,
        status: "draft",
        project_id: projectId,
      }));



      const { data: insertedRows, error: insertBatchError } = await supabase
        .from("translations")
        .insert(rowsToInsert)
        .select();

      if (insertBatchError) {
        return NextResponse.json(
          { error: "Failed to save batch translations", details: insertBatchError.message },
          { status: 500 }
        );
      }

      if (insertedRows) {
        for (const rawRow of insertedRows) {
          const row = rawRow as unknown as TranslationRow;
          resultMap[row.source_text] = {
            translation: row.translation ?? row.source_text,
            reviewed: false,
            id: row.id,
          };
        }
      }
    }

    return NextResponse.json({ translations: resultMap });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const isQuotaError =
      message.includes("429") ||
      message.includes("Quota exceeded") ||
      message.includes("limit: 0");

    if (isQuotaError) {
      return NextResponse.json(
        {
          error: "Gemini API rate limit or quota exceeded.",
          details: message,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error", details: message },
      { status: 500 }
    );
  }
}
