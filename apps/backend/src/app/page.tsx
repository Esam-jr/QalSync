"use client";

import { useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"init" | "sync" | "check" | "review">("sync");

  const copyCommand = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-void text-ivory flex flex-col font-sans selection:bg-crimson selection:text-white">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 border-b border-ash/60 bg-void/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 group">
           
            <span className="text-xl font-bold tracking-tight text-ivory">
              Qal<span className="text-blood">Sync</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-silver">
            <a href="#features" className="hover:text-ivory transition-colors">
              Features
            </a>
            <a href="#workflow" className="hover:text-ivory transition-colors">
              How It Works
            </a>
            <a href="#cli" className="hover:text-ivory transition-colors">
              CLI Reference 
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/review"
              className="flex items-center gap-2 rounded-xl bg-blood px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blood/20 transition-all hover:bg-blood-glow hover:shadow-blood/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Review Dashboard</span>
              <span className="text-xs">→</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24 border-b border-ash/40">
        {/* Background Glow Orbs */}
        <div className="pointer-events-none absolute left-1/2 top-10 -z-10 h-[380px] w-[600px] -translate-x-1/2 rounded-full bg-blood/10 blur-[130px]" />
        <div className="pointer-events-none absolute right-10 top-40 -z-10 h-[250px] w-[350px] rounded-full bg-crimson/10 blur-[100px]" />

        <div className="mx-auto max-w-5xl px-6 text-center">
          {/* Badge */}
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-blood/30 bg-blood/10 px-4 py-1.5 text-xs font-semibold text-blood-glow backdrop-blur-md shadow-inner">
            <span className="h-2 w-2 rounded-full bg-blood animate-pulse" />
            <span>AI-POWERED LOCALIZATION FOR EAST AFRICAN LANGUAGES</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl font-extrabold tracking-tight text-ivory sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1]">
            Localize your React & Next.js apps into{" "}
            <span className="bg-gradient-to-r from-blood via-blood-glow to-amber-400 bg-clip-text text-transparent">
              Amharic, Afaan Oromo, & Tigrinya
            </span>
          </h1>

          {/* Subtext */}
          <p className="mx-auto mt-6 max-w-2xl text-base text-silver sm:text-lg md:text-xl leading-relaxed">
            Zero manual JSON wrangling. Automatic AST string extraction, 2-level incremental caching, and Gemini AI translations — with an optional human review dashboard.
          </p>

          {/* Quick Install Pill & Actions */}
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <div className="flex items-center gap-3 rounded-xl border border-ash bg-obsidian/90 px-4 py-2.5 font-mono text-sm text-bone shadow-2xl backdrop-blur-md">
              <span className="text-blood">$</span>
              <span>npm install @qalsync/client &amp;&amp; npx qalsync init</span>
              <button
                onClick={() => copyCommand("npm install @qalsync/client && npx qalsync init")}
                className="ml-2 rounded-lg border border-ash/60 bg-onyx px-2.5 py-1 text-xs text-silver hover:border-blood hover:text-ivory transition-all"
                title="Copy Command"
              >
                {copied ? "✓ Copied!" : "📋 Copy"}
              </button>
            </div>
          </div>

          {/* Language Pills Bar */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-silver">
            <span className="text-smoke uppercase tracking-wider">Supported out of the box:</span>
            <span className="rounded-lg border border-ash bg-obsidian px-3 py-1.5 text-ivory flex items-center gap-1.5">
              <span>🇪🇹</span> Amharic <span className="text-silver font-mono">(አማርኛ)</span>
            </span>
            <span className="rounded-lg border border-ash bg-obsidian px-3 py-1.5 text-ivory flex items-center gap-1.5">
              <span>🇪🇹</span> Afaan Oromo <span className="text-silver font-mono">(om)</span>
            </span>
            <span className="rounded-lg border border-ash bg-obsidian px-3 py-1.5 text-ivory flex items-center gap-1.5">
              <span>🇪🇹</span> Tigrinya <span className="text-silver font-mono">(ትግርኛ)</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── Interactive CLI Terminal Demo Section ── */}
      <section className="py-16 md:py-24 border-b border-ash/40 bg-obsidian/40 relative">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory">
              Developer Workflow in 3 Seconds
            </h2>
            <p className="mt-2 text-sm text-silver">
              Run <code className="text-blood-glow font-mono">npx qalsync sync</code> anytime you write new UI components.
            </p>
          </div>

          {/* Terminal Window Box */}
          <div className="overflow-hidden rounded-2xl border border-ash/80 bg-obsidian shadow-2xl shadow-black/80">
            {/* Terminal Header */}
            <div className="flex items-center justify-between border-b border-ash/60 bg-onyx/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-2 font-mono text-xs text-slate">bash — qalsync sync</span>
              </div>
              <span className="font-mono text-[11px] text-smoke">v0.1.0</span>
            </div>

            {/* Terminal Content */}
            <div className="p-6 font-mono text-xs leading-relaxed text-bone overflow-x-auto">
              <div className="flex items-center gap-2 text-silver">
                <span className="text-blood">$</span>
                <span className="text-ivory">npx qalsync sync</span>
              </div>
              <p className="text-silver mt-2">🔍 [QalSync] Scanning codebase at: <span className="text-bone">./src/app</span></p>
              <p className="text-emerald-400 mt-1">✨ Found 38 total UI strings in 14 components.</p>
              <p className="text-blue-400 mt-1">📁 Updated source dictionary: <span className="text-ivory">messages/en.json</span> (38 keys)</p>
              <div className="my-3 border-t border-ash/40" />
              <p className="text-amber-300">🌐 [am] Translating 4 new strings via Gemini AI (project: &apos;my-next-app&apos;)...</p>
              <p className="text-emerald-400">✅ [am] Merged 4 new translations into <span className="text-ivory">messages/am.json</span> (Total: 38)</p>
              <p className="text-amber-300 mt-1">🌐 [om] Translating 4 new strings via Gemini AI (project: &apos;my-next-app&apos;)...</p>
              <p className="text-emerald-400">✅ [om] Merged 4 new translations into <span className="text-ivory">messages/om.json</span> (Total: 38)</p>
              <p className="text-amber-300 mt-1">🌐 [ti] Translating 4 new strings via Gemini AI (project: &apos;my-next-app&apos;)...</p>
              <p className="text-emerald-400">✅ [ti] Merged 4 new translations into <span className="text-ivory">messages/ti.json</span> (Total: 38)</p>
              <div className="mt-4 rounded-lg bg-emerald-950/40 border border-emerald-800/40 p-3 text-emerald-300 font-semibold">
                =========================================================<br />
                ✅ QALSYNC SYNC COMPLETE — All JSON dictionaries ready for next-intl / i18next<br />
                =========================================================
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3-Step How It Works Section ── */}
      <section id="workflow" className="py-16 md:py-24 border-b border-ash/40">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-blood">Zero Friction</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ivory sm:text-4xl">
              How QalSync Works
            </h2>
            <p className="mt-3 text-sm text-silver max-w-xl mx-auto">
              Add localization to your app in under 2 minutes without manually writing JSON files or managing translations by hand.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="rounded-2xl border border-ash bg-obsidian p-6 shadow-xl relative group hover:border-crimson transition-colors">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blood/10 border border-blood/30 font-bold text-blood text-sm">
                01
              </div>
              <h3 className="text-lg font-bold text-ivory mb-2">Initialize Config</h3>
              <p className="text-xs text-silver leading-relaxed mb-4">
                Run <code className="text-blood-glow font-mono">npx qalsync init</code>. Select your target languages (Amharic, Afaan Oromo, Tigrinya).
              </p>

              <div className="rounded-lg border border-ash/60 bg-onyx p-3 font-mono text-[11px] text-bone">
                <p className="text-slate">// qalsync.config.ts</p>
                <p><span className="text-blood">targetLocales</span>: [&quot;am&quot;, &quot;om&quot;, &quot;ti&quot;]</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-ash bg-obsidian p-6 shadow-xl relative group hover:border-crimson transition-colors">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blood/10 border border-blood/30 font-bold text-blood text-sm">
                02
              </div>
              <h3 className="text-lg font-bold text-ivory mb-2">Write Normal JSX</h3>
              <p className="text-xs text-silver leading-relaxed mb-4">
                Write standard React UI code. QalSync automatically discovers all user-facing UI text strings.
              </p>

              <div className="rounded-lg border border-ash/60 bg-onyx p-3 font-mono text-[11px] text-bone">
                <p className="text-slate">&lt;h1&gt;Welcome back&lt;/h1&gt;</p>
                <p className="text-slate">&lt;Button&gt;Save Changes&lt;/Button&gt;</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-ash bg-obsidian p-6 shadow-xl relative group hover:border-crimson transition-colors">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blood/10 border border-blood/30 font-bold text-blood text-sm">
                03
              </div>
              <h3 className="text-lg font-bold text-ivory mb-2">Run Sync</h3>
              <p className="text-xs text-silver leading-relaxed mb-4">
                Run <code className="text-blood-glow font-mono">npx qalsync sync</code>. Missing strings are translated via Gemini AI and written directly into <code className="text-ivory font-mono">messages/*.json</code>.
              </p>

              <div className="rounded-lg border border-ash/60 bg-onyx p-3 font-mono text-[11px] text-bone">
                <p className="text-emerald-400">&quot;Save Changes&quot;: &quot;ለውጦችን አስቀምጥ&quot;</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Features Section ── */}
      <section id="features" className="py-16 md:py-24 border-b border-ash/40 bg-obsidian/30">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-blood">Enterprise Grade</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ivory sm:text-4xl">
              Engineered for Speed &amp; Accuracy
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-ash bg-onyx/60 p-6 backdrop-blur-md hover:border-crimson transition-colors">
              <div className="mb-4 text-2xl">🔍</div>
              <h3 className="text-base font-bold text-ivory mb-1.5">AST Codebase Scanner</h3>
              <p className="text-xs text-silver leading-relaxed">
                Parses TypeScript &amp; JSX ASTs to find user-facing text elements, placeholders, labels, and titles automatically.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-ash bg-onyx/60 p-6 backdrop-blur-md hover:border-crimson transition-colors">
              <div className="mb-4 text-2xl">⚡</div>
              <h3 className="text-base font-bold text-ivory mb-1.5">2-Level Incremental Caching</h3>
              <p className="text-xs text-silver leading-relaxed">
                Combines local JSON dictionary cache with Supabase PostgreSQL caching. Never pay for or translate the same string twice.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-ash bg-onyx/60 p-6 backdrop-blur-md hover:border-crimson transition-colors">
              <div className="mb-4 text-2xl">🤖</div>
              <h3 className="text-base font-bold text-ivory mb-1.5">Gemini AI Context Engine</h3>
              <p className="text-xs text-silver leading-relaxed">
                Tuned specifically for low-resource languages (Amharic, Afaan Oromo, Tigrinya) to ensure natural, contemporary phrasing.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-ash bg-onyx/60 p-6 backdrop-blur-md hover:border-crimson transition-colors">
              <div className="mb-4 text-2xl">👥</div>
              <h3 className="text-base font-bold text-ivory mb-1.5">Human Review Portal</h3>
              <p className="text-xs text-silver leading-relaxed">
                Full web dashboard for translators to review, edit, approve, or reject AI translation drafts with custom project scoping.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-ash bg-onyx/60 p-6 backdrop-blur-md hover:border-crimson transition-colors">
              <div className="mb-4 text-2xl">🛡️</div>
              <h3 className="text-base font-bold text-ivory mb-1.5">CI/CD Automated Guard</h3>
              <p className="text-xs text-silver leading-relaxed">
                Run <code className="text-blood-glow font-mono">npx qalsync sync --check</code> in your GitHub Actions pipeline to fail builds if untranslated strings exist.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-ash bg-onyx/60 p-6 backdrop-blur-md hover:border-crimson transition-colors">
              <div className="mb-4 text-2xl">📁</div>
              <h3 className="text-base font-bold text-ivory mb-1.5">Standard i18n Compatibility</h3>
              <p className="text-xs text-silver leading-relaxed">
                Generates key-value JSON files 100% compatible with <code className="text-ivory font-mono">next-intl</code>, <code className="text-ivory font-mono">i18next</code>, or custom translation hooks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CLI Command Reference Section ── */}
      <section id="cli" className="py-16 md:py-24 border-b border-ash/40">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-ivory">CLI Command Reference</h2>
            <p className="mt-2 text-sm text-silver">Simple, memorable commands for your terminal.</p>
          </div>

          {/* Command Tabs */}
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {(["sync", "init", "check", "review"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all hover:cursor-pointer ${
                  activeTab === tab
                    ? "bg-blood text-white shadow-lg shadow-blood/20"
                    : "border border-ash bg-obsidian text-silver hover:text-ivory"
                }`}
              >
                {tab === "sync" && "npx qalsync sync"}
                {tab === "init" && "npx qalsync init"}
                {tab === "check" && "npx qalsync sync --check"}
                {tab === "review" && "npx qalsync review"}
              </button>
            ))}
          </div>

          {/* Active Tab Box */}
          <div className="rounded-2xl border border-ash bg-obsidian p-6 shadow-2xl max-w-3xl mx-auto">
            {activeTab === "sync" && (
              <div>
                <h3 className="text-base font-bold text-ivory mb-1 font-mono">npx qalsync sync</h3>
                <p className="text-xs text-silver mb-4">
                  Scans your codebase for UI strings, compares with existing dictionaries and database cache, translates only new strings via Gemini AI, and merges JSON files into <code className="text-blood-glow font-mono">messages/*.json</code>.
                </p>
                <div className="rounded-lg bg-onyx p-3 font-mono text-xs text-bone border border-ash/60">
                  <p className="text-silver">$ npx qalsync sync</p>
                  <p className="text-slate">// Options: --dir ./src/app --locale am --project-id my-app</p>
                </div>
              </div>
            )}

            {activeTab === "init" && (
              <div>
                <h3 className="text-base font-bold text-ivory mb-1 font-mono">npx qalsync init</h3>
                <p className="text-xs text-silver mb-4">
                  Creates <code className="text-blood-glow font-mono">qalsync.config.ts</code> with your project ID (auto-detected from package.json) and interactively prompts for target languages.
                </p>
                <div className="rounded-lg bg-onyx p-3 font-mono text-xs text-bone border border-ash/60">
                  <p className="text-silver">$ npx qalsync init</p>
                  <p className="text-slate">// Or skip prompts: npx qalsync init -l am,om,ti</p>
                </div>
              </div>
            )}

            {activeTab === "check" && (
              <div>
                <h3 className="text-base font-bold text-ivory mb-1 font-mono">npx qalsync sync --check</h3>
                <p className="text-xs text-silver mb-4">
                  CI mode for sync: verifies all codebase strings are translated in dictionaries. Exits with status code <code className="text-red-400 font-mono">1</code> if missing translations are found.
                </p>
                <div className="rounded-lg bg-onyx p-3 font-mono text-xs text-bone border border-ash/60">
                  <p className="text-silver">$ npx qalsync sync --check</p>
                  <p className="text-slate">// Use in GitHub Actions / CI pipeline steps</p>
                </div>
              </div>
            )}

            {activeTab === "review" && (

              <div>
                <h3 className="text-base font-bold text-ivory mb-1 font-mono">npx qalsync review</h3>
                <p className="text-xs text-silver mb-4">
                  Launches the QalSync Review Dashboard in your default web browser for human verification and edits.
                </p>
                <div className="rounded-lg bg-onyx p-3 font-mono text-xs text-bone border border-ash/60">
                  <p className="text-silver">$ npx qalsync review</p>
                  <p className="text-slate">🚀 Opening http://localhost:3000/review...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-ash/60 bg-void py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blood/10 border border-blood/30 text-blood font-bold text-xs">
              Q
            </div>
            <span className="text-sm font-bold text-ivory">QalSync</span>
            <span className="text-xs text-slate">© 2026</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-silver">
            <Link href="/review" className="hover:text-ivory transition-colors">
              Review Dashboard
            </Link>
            <a
              href="https://github.com/Esam-jr/QalSync"
              target="_blank"
              rel="noreferrer"
              className="hover:text-ivory transition-colors"
            >
              GitHub Repository
            </a>
            <span className="rounded bg-ash/60 px-2 py-0.5 text-[10px] text-silver font-mono">MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
