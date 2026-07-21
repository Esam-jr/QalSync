"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { Session } from "@supabase/supabase-js";


type Translation = {
  id: string;
  source_text: string;
  translation: string | null;
  locale: string;
  status: string;
  project_id: string;
  created_at: string;
};

type RowError = { id: string; message: string };


function friendlyFetchError(status: number, fallback: string): string {
  const map: Record<number, string> = {
    400: "Bad request — check your inputs and try again.",
    401: "Session expired. Please log in again.",
    403: "You don't have permission to perform this action.",
    404: "Translation not found — it may have been deleted.",
    409: "Conflict — this translation was already updated by someone else.",
    422: "Invalid data — make sure the translation is not empty.",
    429: "Too many requests — slow down and try again in a moment.",
    500: "Server error — something went wrong on our end.",
    502: "Bad gateway — the server is temporarily unavailable.",
    503: "Service unavailable — please try again later.",
  };
  return map[status] ?? fallback;
}

function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login")) return "Incorrect email or password.";
  if (lower.includes("email not confirmed"))
    return "Check your inbox — your email hasn't been confirmed yet.";
  if (lower.includes("already registered") || lower.includes("already exists"))
    return "An account with this email already exists. Try logging in.";
  if (lower.includes("weak password") || lower.includes("at least"))
    return "Password is too weak — use at least 6 characters.";
  if (lower.includes("rate limit"))
    return "Too many attempts. Please wait a moment and try again.";
  return message;
}

/* ── Spinner component ── */

function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      style={{ animation: "spin 1s linear infinite" }}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width="16"
      height="16"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

/* ── Toast notification ── */

function Toast({
  message,
  type,
  onDismiss,
}: {
  message: string;
  type: "success" | "error";
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-lg border px-5 py-3 shadow-2xl transition-all ${
        type === "success"
          ? "border-success/30 bg-success-dark/90 text-white"
          : "border-blood/30 bg-crimson-dark/90 text-white"
      }`}
    >
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onDismiss}
        className="ml-2 text-white/60 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  );
}

/* ══════════════════════════════════════
   Main page component
   ══════════════════════════════════════ */

export default function ReviewPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Dashboard
  const [projectId, setProjectId] = useState("default");
  const [locale, setLocale] = useState("am");
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [editedTranslations, setEditedTranslations] = useState<
    Record<string, string>
  >({});
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [rowErrors, setRowErrors] = useState<RowError[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  /* ── Auth lifecycle ── */

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSubmitting(true);

    try {
      const result = isSignUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        setAuthError(friendlyAuthError(result.error.message));
      } else if (isSignUp && result.data.user && !result.data.session) {
        setToast({
          message: "Account created! Check your email to confirm.",
          type: "success",
        });
      }
    } catch {
      setAuthError("Network error. Check your connection and try again.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  /* ── Fetch translations ── */

  const fetchTranslations = useCallback(async () => {
    setFetchError("");
    setFetchLoading(true);
    setRowErrors([]);

    try {
      const params = new URLSearchParams({
        projectId,
        locale,
        status: "draft",
      });
      const res = await fetch(`/api/translations?${params}`);

      if (!res.ok) {
        throw new Error(
          friendlyFetchError(res.status, `Request failed (${res.status})`)
        );
      }

      const data = await res.json();
      setTranslations(data.translations || []);
      setEditedTranslations({});
    } catch (err) {
      if (err instanceof TypeError) {
        setFetchError("Network error — unable to reach the server.");
      } else {
        setFetchError(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
      }
    } finally {
      setFetchLoading(false);
    }
  }, [projectId, locale]);

  useEffect(() => {
    if (session) fetchTranslations();
  }, [session, fetchTranslations]);

  /* ── Approve a translation ── */

  const handleApprove = async (id: string) => {
    // Clear any previous error for this row
    setRowErrors((prev) => prev.filter((e) => e.id !== id));
    setApprovingIds((prev) => new Set(prev).add(id));

    try {
      const body: Record<string, string> = { status: "approved" };
      if (editedTranslations[id] !== undefined) {
        body.translation = editedTranslations[id];
      }

      const res = await fetch(`/api/translations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errMsg = friendlyFetchError(
          res.status,
          "Failed to approve this translation."
        );
        setRowErrors((prev) => [...prev, { id, message: errMsg }]);
        return;
      }

      setTranslations((prev) => prev.filter((t) => t.id !== id));
      setToast({ message: "Translation approved!", type: "success" });
    } catch (err) {
      const message =
        err instanceof TypeError
          ? "Network error — check your connection."
          : err instanceof Error
            ? err.message
            : "Something went wrong.";
      setRowErrors((prev) => [...prev, { id, message }]);
    } finally {
      setApprovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const getRowError = (id: string) =>
    rowErrors.find((e) => e.id === id)?.message;

  /* ══════════════════════════════════════
     Render
     ══════════════════════════════════════ */

  // ── Loading splash ──
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-void">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8 text-blood" />
          <p className="text-silver text-sm">Loading…</p>
        </div>
      </main>
    );
  }

  // ── Auth screen ──
  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-void px-4">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
          />
        )}

        <div className="w-full max-w-sm">
          {/* Logo / Title */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-ivory">
              Qal<span className="text-blood">Sync</span>
            </h1>
            <p className="mt-2 text-sm text-silver">
              Translation review dashboard
            </p>
          </div>

          {/* Card */}
          <div className="rounded-xl border border-ash bg-obsidian p-6 shadow-2xl">
            <h2 className="mb-5 text-lg font-semibold text-bone">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h2>

            {authError && (
              <div className="mb-4 rounded-lg border border-blood/30 bg-crimson-deep/50 px-4 py-3 text-sm text-blood-glow">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-silver">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-ash bg-onyx px-3.5 py-2.5 text-sm text-ivory placeholder-smoke outline-none transition-colors focus:border-crimson focus:ring-1 focus:ring-crimson/50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-silver">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-ash bg-onyx px-3.5 py-2.5 text-sm text-ivory placeholder-smoke outline-none transition-colors focus:border-crimson focus:ring-1 focus:ring-crimson/50"
                />
              </div>

              <button
                type="submit"
                disabled={authSubmitting}
                className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-blood px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blood/20 transition-all hover:bg-blood-glow hover:shadow-blood/40 disabled:cursor-not-allowed disabled:opacity-50 hover:cursor-pointer"
              >
                {authSubmitting && <Spinner />}
                {authSubmitting
                  ? "Please wait…"
                  : isSignUp
                    ? "Create Account"
                    : "Sign In"}
              </button>
            </form>

            <div className="mt-5 border-t border-ash pt-4 text-center text-sm text-silver">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError("");
                }}
                className="font-medium text-blood transition-colors hover:text-blood-glow hover:cursor-pointer"
              >
                {isSignUp ? "Sign In" : "Create one"}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Dashboard ──
  return (
    <main className="min-h-screen bg-void px-4 py-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ivory">
              Qal<span className="text-blood">Sync</span>
              <span className="ml-2 text-base font-normal text-silver">
                Review
              </span>
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-ash bg-onyx px-4 py-2 text-sm text-silver transition-colors hover:border-crimson hover:text-ivory"
          >
            Log Out
          </button>
        </div>

        {/* Filters bar */}
        <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-ash bg-obsidian p-4">
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1.5 block text-xs font-medium text-silver">
              Project ID
            </label>
            <input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-lg border border-ash bg-onyx px-3 py-2 text-sm text-ivory outline-none transition-colors focus:border-crimson"
            />
          </div>

          <div className="min-w-[160px]">
            <label className="mb-1.5 block text-xs font-medium text-silver">
              Target Language
            </label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="w-full rounded-lg border border-ash bg-onyx px-3 py-2 text-sm text-ivory outline-none transition-colors focus:border-crimson"
            >
              <option value="am">Amharic (አማርኛ)</option>
              <option value="om">Afaan Oromo</option>
            </select>
          </div>

          <button
            onClick={fetchTranslations}
            disabled={fetchLoading}
            className="flex items-center gap-2 rounded-lg border border-crimson bg-crimson-dark px-4 py-2 text-sm font-medium text-ivory transition-all hover:bg-crimson disabled:cursor-not-allowed disabled:opacity-50"
          >
            {fetchLoading && <Spinner />}
            {fetchLoading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {/* Fetch error */}
        {fetchError && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-blood/30 bg-crimson-deep/40 px-5 py-4">
            <span className="text-lg">⚠</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-blood-glow">
                {fetchError}
              </p>
            </div>
            <button
              onClick={fetchTranslations}
              className="rounded-md bg-crimson-dark px-3 py-1.5 text-xs font-medium text-ivory transition-colors hover:bg-crimson"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!fetchLoading && !fetchError && translations.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-ash bg-obsidian py-16">
            <div className="mb-4 text-4xl opacity-30">✓</div>
            <p className="text-lg font-medium text-silver">All caught up!</p>
            <p className="mt-1 text-sm text-smoke">
              No draft translations to review.
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {fetchLoading && translations.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl border border-ash bg-obsidian"
              />
            ))}
          </div>
        )}

        {/* Translation cards */}
        {translations.length > 0 && (
          <div className="space-y-3">
            <p className="mb-2 text-xs font-medium text-silver">
              {translations.length} draft
              {translations.length !== 1 ? "s" : ""} pending review
            </p>

            {translations.map((t) => {
              const isPending = approvingIds.has(t.id);
              const error = getRowError(t.id);

              return (
                <div
                  key={t.id}
                  className={`group rounded-xl border transition-colors ${
                    error
                      ? "border-blood/40 bg-crimson-deep/20"
                      : "border-ash bg-obsidian hover:border-crimson-dark"
                  }`}
                >
                  <div className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto]">
                    {/* Source text */}
                    <div>
                      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-smoke">
                        Source
                      </span>
                      <p className="text-sm leading-relaxed text-bone">
                        {t.source_text}
                      </p>
                    </div>

                    {/* Editable translation */}
                    <div>
                      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-smoke">
                        Translation ·{" "}
                        {t.locale === "am" ? "አማርኛ" : "Afaan Oromo"}
                      </span>
                      <textarea
                        defaultValue={t.translation ?? ""}
                        onChange={(e) =>
                          setEditedTranslations((prev) => ({
                            ...prev,
                            [t.id]: e.target.value,
                          }))
                        }
                        rows={3}
                        disabled={isPending}
                        className="w-full resize-y rounded-lg border border-ash bg-onyx px-3 py-2 text-sm text-ivory outline-none transition-colors focus:border-crimson disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    {/* Approve button */}
                    <div className="flex items-start pt-5 md:pt-6">
                      <button
                        onClick={() => handleApprove(t.id)}
                        disabled={isPending}
                        className="flex items-center gap-2 rounded-lg bg-blood px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blood/20 transition-all hover:bg-blood-glow hover:shadow-blood/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                      >
                        {isPending ? (
                          <>
                            <Spinner />
                            Approving…
                          </>
                        ) : (
                          "Approve"
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Row-level error */}
                  {error && (
                    <div className="border-t border-blood/20 bg-crimson-deep/30 px-5 py-3">
                      <p className="text-xs text-blood-glow">⚠ {error}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
