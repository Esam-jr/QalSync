"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { Session } from "@supabase/supabase-js";

type Translation = {
  id: string;
  source_text: string;
  translation: string | null;
  locale: string;
  status: "draft" | "approved";
  project_id: string;
  created_at: string;
};

type RowError = { id: string; message: string };

function friendlyFetchError(status: number, fallback: string): string {
  const map: Record<number, string> = {
    400: "Bad request — check your inputs and try again.",
    401: "Session expired or unauthorized. Please log in again.",
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
  if (lower.includes("invalid login") || lower.includes("invalid credentials"))
    return "Incorrect email or password.";
  if (lower.includes("email not confirmed"))
    return "Your email has not been confirmed yet. Please check your inbox for the confirmation link.";
  if (
    lower.includes("already registered") ||
    lower.includes("already exists") ||
    lower.includes("user_already_exists")
  )
    return "An account with this email already exists. Click 'Sign In' below.";
  if (lower.includes("weak password") || lower.includes("at least"))
    return "Password is too weak — please use at least 6 characters.";
  if (
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("429")
  )
    return "Supabase rate limit reached. Please wait 60 seconds before trying again.";
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
        className="ml-2 text-white/60 hover:text-white transition-colors hover:cursor-pointer"
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

  // Auth state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Mandatory Project Selection state
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectIdInput, setProjectIdInput] = useState("");

  // Dashboard state
  const [locale, setLocale] = useState("am");
  const [statusTab, setStatusTab] = useState<"draft" | "approved" | "all">("draft");
  const [searchQuery, setSearchQuery] = useState("");

  const [translations, setTranslations] = useState<Translation[]>([]);
  const [editedTranslations, setEditedTranslations] = useState<
    Record<string, string>
  >({});

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [rowErrors, setRowErrors] = useState<RowError[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  /* ── Auth & LocalStorage Initialization ── */

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedProject = localStorage.getItem("qalsync_active_project_id");
      if (savedProject) {
        setSelectedProject(savedProject);
        setProjectIdInput(savedProject);
        setIsProjectModalOpen(false);
      } else {
        setIsProjectModalOpen(true);
      }
    }
  }, []);

  const selectProject = (id: string) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    setSelectedProject(trimmed);
    setProjectIdInput(trimmed);
    localStorage.setItem("qalsync_active_project_id", trimmed);
    setIsProjectModalOpen(false);
  };


  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setAuthSubmitting(true);

    try {
      const result = isSignUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        setAuthError(friendlyAuthError(result.error.message));
      } else if (isSignUp && result.data.user) {
        if (result.data.session) {
          setSession(result.data.session);
        } else {
          setAuthSuccess(
            "Account created! Check your inbox to confirm, then sign in."
          );
          setIsSignUp(false);
        }
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
    if (!selectedProject) return;
    setFetchError("");
    setFetchLoading(true);
    setRowErrors([]);
    setSelectedIds(new Set());

    try {
      const params = new URLSearchParams({
        projectId: selectedProject,
        locale,
        status: statusTab,
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
  }, [selectedProject, locale, statusTab]);

  useEffect(() => {
    if (session && selectedProject && !isProjectModalOpen) {
      fetchTranslations();
    }
  }, [session, selectedProject, isProjectModalOpen, fetchTranslations]);

  /* ── Computed Filtered Rows & Combobox Results ── */

  const filteredTranslations = useMemo(() => {
    if (!searchQuery.trim()) return translations;
    const q = searchQuery.toLowerCase().trim();
    return translations.filter(
      (t) =>
        t.source_text.toLowerCase().includes(q) ||
        (t.translation && t.translation.toLowerCase().includes(q))
    );
  }, [translations, searchQuery]);

  /* ── Selection Helpers ── */


  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTranslations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTranslations.map((t) => t.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ── Actions ── */

  const handleApprove = async (id: string) => {
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
          "Failed to approve translation."
        );
        setRowErrors((prev) => [...prev, { id, message: errMsg }]);
        return;
      }

      if (statusTab === "draft") {
        setTranslations((prev) => prev.filter((t) => t.id !== id));
      } else {
        setTranslations((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: "approved",
                  translation: editedTranslations[id] ?? t.translation,
                }
              : t
          )
        );
      }

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

  const handleDelete = async (id: string) => {
    setRowErrors((prev) => prev.filter((e) => e.id !== id));
    setDeletingIds((prev) => new Set(prev).add(id));

    try {
      const res = await fetch(`/api/translations/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errMsg = friendlyFetchError(
          res.status,
          "Failed to delete translation."
        );
        setRowErrors((prev) => [...prev, { id, message: errMsg }]);
        return;
      }

      setTranslations((prev) => prev.filter((t) => t.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      setToast({ message: "Translation removed", type: "success" });
    } catch (err) {
      const message =
        err instanceof TypeError
          ? "Network error — check your connection."
          : err instanceof Error
            ? err.message
            : "Failed to delete.";
      setRowErrors((prev) => [...prev, { id, message }]);
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);

    const idsToApprove = Array.from(selectedIds);
    let successCount = 0;

    for (const id of idsToApprove) {
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

        if (res.ok) successCount++;
      } catch {
        // Best effort
      }
    }

    fetchTranslations();
    setBulkLoading(false);
    setToast({
      message: `Successfully approved ${successCount} translation(s)!`,
      type: "success",
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);

    const idsToDelete = Array.from(selectedIds);
    let successCount = 0;

    for (const id of idsToDelete) {
      try {
        const res = await fetch(`/api/translations/${id}`, {
          method: "DELETE",
        });
        if (res.ok) successCount++;
      } catch {
        // Best effort
      }
    }

    fetchTranslations();
    setBulkLoading(false);
    setToast({
      message: `Deleted ${successCount} translation(s).`,
      type: "success",
    });
  };

  const getRowError = (id: string) =>
    rowErrors.find((e) => e.id === id)?.message;

  /* ══════════════════════════════════════
     Render
     ══════════════════════════════════════ */

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
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-ivory">
              Qal<span className="text-blood">Sync</span>
            </h1>
            <p className="mt-2 text-sm text-silver">
              Translation review dashboard
            </p>
          </div>

          <div className="rounded-xl border border-ash bg-obsidian p-6 shadow-2xl">
            <h2 className="mb-5 text-lg font-semibold text-bone">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h2>

            {authError && (
              <div className="mb-4 rounded-lg border border-blood/30 bg-crimson-deep/50 px-4 py-3 text-sm text-blood-glow">
                {authError}
              </div>
            )}

            {authSuccess && (
              <div className="mb-4 rounded-lg border border-success-dark/40 bg-success-dark/30 px-4 py-3 text-sm text-green-300">
                {authSuccess}
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
                  setAuthSuccess("");
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

  const showModal = !selectedProject || isProjectModalOpen;

  return (
    <main className="min-h-screen bg-void px-4 py-8 relative">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Mandatory Project Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="w-full max-w-md rounded-xl border border-ash bg-obsidian p-6 shadow-2xl">
            <div className="mb-5 text-center">
              <span className="mb-2 inline-block text-2xl">🔒</span>
              <h2 className="text-xl font-bold text-ivory">
                Enter Project ID to Review
              </h2>
              <p className="mt-1.5 text-xs text-silver">
                Please enter your Project ID to unlock your translation dashboard.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (projectIdInput.trim()) selectProject(projectIdInput);
              }}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-silver">
                  Project ID
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. storefront-web or default"
                  value={projectIdInput}
                  onChange={(e) => setProjectIdInput(e.target.value)}
                  className="w-full rounded-lg border border-ash bg-onyx px-3.5 py-2.5 text-sm text-ivory placeholder-smoke outline-none transition-colors focus:border-crimson"
                />
                <p className="mt-2 text-xs leading-relaxed text-smoke bg-onyx/50 p-2.5 rounded-lg border border-ash/40">
                  💡 <span className="font-semibold text-silver">Note:</span> You can find your Project ID name in your project&apos;s generated QalSync configuration file (<code className="text-blood-glow font-mono">qalsync.config.ts</code>).
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                {selectedProject && (
                  <button
                    type="button"
                    onClick={() => setIsProjectModalOpen(false)}
                    className="rounded-lg border border-ash bg-onyx px-4 py-2 text-xs font-medium text-silver transition-colors hover:text-ivory hover:cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!projectIdInput.trim()}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blood px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blood/20 transition-all hover:bg-blood-glow disabled:cursor-not-allowed disabled:opacity-50 hover:cursor-pointer"
                >
                  Continue to Dashboard →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Dashboard UI (Blurred when modal is open) */}
      <div className={`mx-auto max-w-5xl transition-all ${showModal ? "blur-sm pointer-events-none" : ""}`}>
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ivory">
              Qal<span className="text-blood">Sync</span>
              <span className="ml-2 text-base font-normal text-silver">
                Review Dashboard
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {selectedProject && (
              <div className="flex items-center gap-2 rounded-lg border border-ash bg-obsidian px-3 py-1.5 text-xs text-ivory">
                <span className="text-silver">Active Project:</span>
                <span className="font-semibold text-blood-glow">
                  {selectedProject === "all" ? "All Projects" : selectedProject}
                </span>
                <button
                  onClick={() => setIsProjectModalOpen(true)}
                  className="ml-2 rounded border border-ash bg-onyx px-2 py-0.5 text-[10px] text-silver hover:border-crimson hover:text-ivory transition-colors hover:cursor-pointer"
                >
                  Switch
                </button>
              </div>
            )}


            <button
              onClick={handleLogout}
              className="rounded-lg border border-ash bg-onyx px-4 py-2 text-sm text-silver transition-colors hover:border-crimson hover:text-ivory hover:cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="mb-6 flex items-center justify-between border-b border-ash pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setStatusTab("draft")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all hover:cursor-pointer ${
                statusTab === "draft"
                  ? "bg-blood text-white shadow-md shadow-blood/20"
                  : "bg-onyx text-silver hover:bg-obsidian hover:text-ivory"
              }`}
            >
              Drafts
            </button>
            <button
              onClick={() => setStatusTab("approved")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all hover:cursor-pointer ${
                statusTab === "approved"
                  ? "bg-blood text-white shadow-md shadow-blood/20"
                  : "bg-onyx text-silver hover:bg-obsidian hover:text-ivory"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusTab("all")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all hover:cursor-pointer ${
                statusTab === "all"
                  ? "bg-blood text-white shadow-md shadow-blood/20"
                  : "bg-onyx text-silver hover:bg-obsidian hover:text-ivory"
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Filters & Search bar */}
        <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-ash bg-obsidian p-4">
          <div className="flex-1 min-w-[240px]">
            <label className="mb-1.5 block text-xs font-medium text-silver">
              Search Strings
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search source or translation text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-ash bg-onyx px-3 py-2 pr-8 text-sm text-ivory placeholder-smoke outline-none transition-colors focus:border-crimson"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-xs text-silver hover:text-ivory"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="min-w-[160px]">
            <label className="mb-1.5 block text-xs font-medium text-silver">
              Target Language
            </label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="w-full rounded-lg border border-ash bg-onyx px-3 py-2 text-sm text-ivory outline-none transition-colors focus:border-crimson hover:cursor-pointer"
            >
              <option value="am">Amharic (አማርኛ)</option>
              <option value="om">Afaan Oromo</option>
              <option value="ti">Tigrinya (ትግርኛ)</option>
            </select>
          </div>


          <button
            onClick={fetchTranslations}
            disabled={fetchLoading}
            className="flex items-center gap-2 rounded-lg border border-crimson bg-crimson-dark px-4 py-2 text-sm font-medium text-ivory transition-all hover:bg-crimson disabled:cursor-not-allowed disabled:opacity-50 hover:cursor-pointer"
          >
            {fetchLoading && <Spinner />}
            {fetchLoading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {/* Bulk Actions Bar */}
        {filteredTranslations.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ash bg-obsidian/70 px-4 py-3">
            <label className="flex items-center gap-2.5 text-xs font-medium text-silver hover:cursor-pointer">
              <input
                type="checkbox"
                checked={
                  selectedIds.size > 0 &&
                  selectedIds.size === filteredTranslations.length
                }
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-ash bg-onyx text-crimson focus:ring-crimson"
              />
              Select All ({selectedIds.size}/{filteredTranslations.length})
            </label>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBulkApprove}
                  disabled={bulkLoading}
                  className="flex items-center gap-2 rounded-lg bg-blood px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-blood/20 transition-all hover:bg-blood-glow disabled:opacity-50 hover:cursor-pointer"
                >
                  {bulkLoading && <Spinner />}
                  Approve Selected ({selectedIds.size})
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkLoading}
                  className="flex items-center gap-2 rounded-lg border border-blood/40 bg-crimson-dark/40 px-4 py-1.5 text-xs font-semibold text-blood-glow transition-all hover:bg-crimson-dark hover:text-white disabled:opacity-50 hover:cursor-pointer"
                >
                  {bulkLoading && <Spinner />}
                  Delete Selected ({selectedIds.size})
                </button>
              </div>
            )}
          </div>
        )}

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
        {!fetchLoading && !fetchError && filteredTranslations.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-ash bg-obsidian py-16">
            <div className="mb-4 text-4xl opacity-30">✓</div>
            <p className="text-lg font-medium text-silver">No translations found</p>
            <p className="mt-1 text-sm text-smoke">
              {searchQuery
                ? `No items matching "${searchQuery}"`
                : statusTab === "draft"
                  ? "All draft translations reviewed!"
                  : "No translations under this filter."}
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
        {filteredTranslations.length > 0 && (
          <div className="space-y-3">
            {filteredTranslations.map((t) => {
              const isApproving = approvingIds.has(t.id);
              const isDeleting = deletingIds.has(t.id);
              const error = getRowError(t.id);
              const isSelected = selectedIds.has(t.id);

              return (
                <div
                  key={t.id}
                  className={`group rounded-xl border transition-colors ${
                    error
                      ? "border-blood/40 bg-crimson-deep/20"
                      : isSelected
                        ? "border-crimson bg-obsidian/90"
                        : "border-ash bg-obsidian hover:border-crimson-dark"
                  }`}
                >
                  <div className="grid gap-4 p-5 md:grid-cols-[auto_1fr_1fr_auto]">
                    {/* Checkbox */}
                    <div className="flex items-start pt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(t.id)}
                        className="h-4 w-4 rounded border-ash bg-onyx text-crimson focus:ring-crimson hover:cursor-pointer"
                      />
                    </div>

                    {/* Source text */}
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-smoke">
                          Source
                        </span>
                        {/* Status Badge */}
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                            t.status === "approved"
                              ? "bg-green-950 text-green-400 border border-green-800"
                              : "bg-amber-950 text-amber-400 border border-amber-800"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-bone">
                        {t.source_text}
                      </p>
                    </div>

                    {/* Editable translation */}
                    <div>
                      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-smoke">
                        Translation ·{" "}
                        {t.locale === "am" ? "አማርኛ" : t.locale === "ti" ? "ትግርኛ" : "Afaan Oromo"}
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
                        disabled={isApproving || isDeleting}
                        className="w-full resize-y rounded-lg border border-ash bg-onyx px-3 py-2 text-sm text-ivory outline-none transition-colors focus:border-crimson disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-4 md:flex-col md:justify-center md:pt-0">
                      <button
                        onClick={() => handleApprove(t.id)}
                        disabled={isApproving || isDeleting}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blood px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blood/20 transition-all hover:bg-blood-glow disabled:cursor-not-allowed disabled:opacity-50 hover:cursor-pointer"
                      >
                        {isApproving ? <Spinner /> : null}
                        {t.status === "approved" ? "Update" : "Approve"}
                      </button>

                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={isApproving || isDeleting}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-ash bg-onyx px-4 py-2 text-xs font-medium text-silver transition-colors hover:border-blood hover:text-blood-glow disabled:cursor-not-allowed disabled:opacity-50 hover:cursor-pointer"
                      >
                        {isDeleting ? <Spinner /> : "Delete"}
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
