import { createClient, type TranslationRow } from "@/lib/supabase";
import { translateText, translateBatchText } from "@/lib/gemini";
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

// ── Input limits ─────────────────────────────────────────────────────────────
const MAX_SINGLE_TEXT_LENGTH = 5_000;   // chars
const MAX_BATCH_SIZE         = 100;     // number of strings per batch request
const MAX_BATCH_TEXT_LENGTH  = 2_000;   // chars per string in a batch

export async function POST(request: NextRequest) {
  try {
    // ── 1. Require caller-provided Gemini API key (BYOK) ─────────────────────
    const geminiApiKey = request.headers.get("x-gemini-api-key")?.trim();
    if (!geminiApiKey) {
      return NextResponse.json(
        {
          error: "Missing Gemini API key.",
          hint: "Add your Gemini API key to the 'x-gemini-api-key' request header. Get a free key at https://aistudio.google.com/apikey",
        },
        { status: 400 }
      );
    }

    // ── 2. Parse body ─────────────────────────────────────────────────────────
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

    // ── 3. Input size caps ────────────────────────────────────────────────────
    if (text && text.length > MAX_SINGLE_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `'text' exceeds the maximum allowed length of ${MAX_SINGLE_TEXT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    if (texts) {
      if (texts.length > MAX_BATCH_SIZE) {
        return NextResponse.json(
          { error: `Batch size exceeds the maximum of ${MAX_BATCH_SIZE} strings per request. Split into smaller batches.` },
          { status: 400 }
        );
      }
      const oversized = texts.find((t) => t.length > MAX_BATCH_TEXT_LENGTH);
      if (oversized) {
        return NextResponse.json(
          { error: `One or more strings in 'texts' exceed the per-item limit of ${MAX_BATCH_TEXT_LENGTH} characters.` },
          { status: 400 }
        );
      }
    }

    const supabase = createClient();

    // ── Single Text Translation Request ──────────────────────────────────────
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
          { error: "Database lookup failed" },
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

      const translation = await translateText(text, locale, geminiApiKey);

      const { data: inserted, error: insertError } = await supabase
        .from("translations")
        .upsert(
          {
            source_text: text,
            source_hash: sourceHash,
            locale,
            translation,
            status: "draft",
            project_id: projectId,
          },
          { onConflict: "source_hash,locale,project_id" }
        )
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: "Failed to save translation" },
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

    // ── Batch Texts Translation Request ──────────────────────────────────────
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
        { error: "Database batch lookup failed" },
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
      const generatedMap = await translateBatchText(uncachedTexts, locale, geminiApiKey);

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
        .upsert(rowsToInsert, {
          onConflict: "source_hash,locale,project_id",
        })
        .select();

      if (insertBatchError) {
        console.error("[QalSync API] Batch upsert error:", insertBatchError.message);
        return NextResponse.json(
          { error: "Failed to save batch translations" },
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
    console.error("[QalSync API Exception]:", err);

    const isQuotaError =
      message.includes("429") ||
      message.includes("Quota exceeded") ||
      message.includes("limit: 0");

    if (isQuotaError) {
      return NextResponse.json(
        {
          error: "Gemini API rate limit or quota exceeded.",
          hint: "Your Gemini API key has hit its rate limit. Wait a moment and try again, or upgrade your Google AI plan at https://aistudio.google.com",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
