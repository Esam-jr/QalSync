"use client";

import { useState, useEffect, useCallback } from "react";
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

export default function ReviewPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // Dashboard state
  const [projectId, setProjectId] = useState("default");
  const [locale, setLocale] = useState("am");
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [editedTranslations, setEditedTranslations] = useState<
    Record<string, string>
  >({});
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
  const [fetchError, setFetchError] = useState("");

  const supabase = createBrowserSupabaseClient();

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
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    const action = isSignUp
      ? supabase.auth.signUp({ email, password })
      : supabase.auth.signInWithPassword({ email, password });

    const { error } = await action;
    if (error) setAuthError(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const fetchTranslations = useCallback(async () => {
    setFetchError("");
    try {
      const params = new URLSearchParams({
        projectId,
        locale,
        status: "draft",
      });
      const res = await fetch(`/api/translations?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      setTranslations(data.translations || []);
      setEditedTranslations({});
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Fetch failed");
    }
  }, [projectId, locale]);

  useEffect(() => {
    if (session) fetchTranslations();
  }, [session, fetchTranslations]);

  const handleApprove = async (id: string) => {
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
        const data = await res.json();
        throw new Error(data.error || "Failed to approve");
      }

      // Remove from draft list
      setTranslations((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setApprovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // --- Render ---

  if (loading) {
    return <main style={styles.container}><p>Loading...</p></main>;
  }

  // Login / Sign-up form
  if (!session) {
    return (
      <main style={styles.container}>
        <h1>QalSync — Review Dashboard</h1>
        <form onSubmit={handleAuth} style={styles.form}>
          <h2>{isSignUp ? "Sign Up" : "Log In"}</h2>
          {authError && <p style={{ color: "red" }}>{authError}</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            {isSignUp ? "Sign Up" : "Log In"}
          </button>
          <p style={{ marginTop: 8, fontSize: 14 }}>
            {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              style={styles.linkButton}
            >
              {isSignUp ? "Log In" : "Sign Up"}
            </button>
          </p>
        </form>
      </main>
    );
  }

  // Dashboard
  return (
    <main style={styles.container}>
      <div style={styles.header}>
        <h1>QalSync — Review Dashboard</h1>
        <button onClick={handleLogout} style={styles.button}>
          Log Out
        </button>
      </div>

      <div style={styles.filters}>
        <label>
          Project ID:{" "}
          <input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            style={styles.input}
          />
        </label>
        <label>
          Locale:{" "}
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            style={styles.input}
          >
            <option value="am">Amharic (am)</option>
            <option value="om">Afaan Oromo (om)</option>
          </select>
        </label>
        <button onClick={fetchTranslations} style={styles.button}>
          Refresh
        </button>
      </div>

      {fetchError && <p style={{ color: "red" }}>{fetchError}</p>}

      {translations.length === 0 ? (
        <p>No draft translations to review.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Source Text</th>
              <th style={styles.th}>Draft Translation</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {translations.map((t) => (
              <tr key={t.id}>
                <td style={styles.td}>{t.source_text}</td>
                <td style={styles.td}>
                  <textarea
                    defaultValue={t.translation ?? ""}
                    onChange={(e) =>
                      setEditedTranslations((prev) => ({
                        ...prev,
                        [t.id]: e.target.value,
                      }))
                    }
                    rows={3}
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </td>
                <td style={styles.td}>
                  <button
                    onClick={() => handleApprove(t.id)}
                    disabled={approvingIds.has(t.id)}
                    style={styles.approveButton}
                  >
                    {approvingIds.has(t.id) ? "Approving…" : "Approve"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

const styles = {
  container: {
    padding: "2rem",
    maxWidth: 960,
    margin: "0 auto",
    fontFamily: "system-ui, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  form: {
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  input: {
    padding: "6px 10px",
    fontSize: 14,
    border: "1px solid #ccc",
    borderRadius: 4,
  },
  button: {
    padding: "8px 16px",
    fontSize: 14,
    cursor: "pointer",
    borderRadius: 4,
    border: "1px solid #333",
    background: "#333",
    color: "#fff",
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "#0070f3",
    cursor: "pointer",
    textDecoration: "underline",
    padding: 0,
    fontSize: 14,
  },
  approveButton: {
    padding: "6px 14px",
    fontSize: 13,
    cursor: "pointer",
    borderRadius: 4,
    border: "1px solid #16a34a",
    background: "#16a34a",
    color: "#fff",
  },
  filters: {
    display: "flex",
    gap: 16,
    alignItems: "center",
    marginBottom: "1rem",
    flexWrap: "wrap" as const,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    marginTop: "1rem",
  },
  th: {
    textAlign: "left" as const,
    borderBottom: "2px solid #ddd",
    padding: "8px",
  },
  td: {
    borderBottom: "1px solid #eee",
    padding: "8px",
    verticalAlign: "top" as const,
  },
} satisfies Record<string, React.CSSProperties>;
