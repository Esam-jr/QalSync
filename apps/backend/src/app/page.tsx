"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  MagnifyingGlass,
  Lightning,
  Cpu,
  Users,
  ShieldCheck,
  Translate,
  ClipboardText,
  Check,
  ArrowRight,
} from "@phosphor-icons/react";

// ── Shared easing curve ──────────────────────────────────────────────────────
const ease = [0.16, 1, 0.3, 1] as const;

// ── Scroll-reveal wrapper ────────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  className = "",
  slideX = false,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  slideX?: boolean;
}) {
  const reduce = useReducedMotion();
  const hidden = slideX ? { opacity: 0, x: -16 } : { opacity: 0, y: 18 };
  const visible = slideX ? { opacity: 1, x: 0 } : { opacity: 1, y: 0 };

  return (
    <motion.div
      initial={reduce ? false : hidden}
      whileInView={visible}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "init" | "sync" | "check" | "review"
  >("sync");
  const reduce = useReducedMotion();

  const copyCommand = () => {
    navigator.clipboard.writeText(
      "npm install @qalsync/client && npx qalsync init"
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-void text-ivory flex flex-col selection:bg-crimson selection:text-white">
      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-ash/60 bg-void/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
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

          <Link
            href="/review"
            className="flex items-center gap-1.5 rounded-xl bg-blood px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blood/20 transition-all hover:bg-blood-glow hover:-translate-y-[1px] active:scale-[0.97]"
          >
            Review Dashboard
            <ArrowRight size={12} weight="bold" />
          </Link>
        </div>
      </header>

      {/* ── Hero: Asymmetric Split ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-ash/40 pt-20 pb-16 md:pt-24 md:pb-20">
        {/* Left-anchored subtle glow — not a centered blob */}
        <div className="pointer-events-none absolute -left-32 -top-16 -z-10 h-[480px] w-[480px] rounded-full bg-blood/6 blur-[110px]" />

        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14 items-center">

            {/* Left — content */}
            <div>
              {/* Badge */}
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-blood/30 bg-blood/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-blood-glow"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blood motion-safe:animate-pulse" />
                AI-Powered Localization
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08, ease }}
                className="text-4xl font-bold tracking-tighter text-ivory leading-[1.08] sm:text-5xl md:text-[3.5rem]"
              >
                Localize your React app into{" "}
                <span className="text-blood">East African languages</span>
              </motion.h1>

              {/* Subtext */}
              <motion.p
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.16, ease }}
                className="mt-5 max-w-lg text-base text-silver leading-relaxed"
              >
                Zero manual JSON wrangling. AST string extraction, incremental
                caching, and Gemini AI translations for Amharic, Afaan Oromo,
                and Tigrinya.
              </motion.p>

              {/* Install pill */}
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.24, ease }}
                className="mt-8 inline-flex items-center gap-3 rounded-xl border border-ash bg-obsidian/90 px-4 py-3 font-mono text-sm text-bone"
              >
                <span className="text-blood select-none">$</span>
                <span className="text-ivory">npm install @qalsync/client</span>
                <button
                  id="hero-copy-btn"
                  onClick={copyCommand}
                  className="ml-1 rounded-lg border border-ash/60 bg-onyx p-1.5 text-silver hover:border-blood/60 hover:text-ivory transition-all active:scale-[0.94]"
                  title="Copy install command"
                  aria-label="Copy install command"
                >
                  {copied ? (
                    <Check size={13} weight="bold" className="text-success" />
                  ) : (
                    <ClipboardText size={13} />
                  )}
                </button>
              </motion.div>
            </div>

            {/* Right — terminal window (the primary visual) */}
            <motion.div
              initial={reduce ? false : { opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease }}
              className="overflow-hidden rounded-2xl border border-ash/80 bg-obsidian shadow-2xl shadow-black/60"
            >
              {/* Terminal chrome */}
              <div className="flex items-center gap-2 border-b border-ash/60 bg-onyx/90 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-500/70" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <span className="h-3 w-3 rounded-full bg-green-500/70" />
                <span className="ml-2 font-mono text-[11px] text-slate">
                  bash — qalsync sync
                </span>
              </div>

              {/* Terminal output */}
              <div className="p-5 font-mono text-xs leading-relaxed text-bone overflow-x-auto">
                <div className="flex items-center gap-2 text-silver">
                  <span className="text-blood">$</span>
                  <span className="text-ivory">npx qalsync sync</span>
                </div>
                <p className="text-silver mt-2">
                  Scanning codebase at:{" "}
                  <span className="text-bone">./src/app</span>
                </p>
                <p className="text-emerald-400 mt-1">
                  Found 38 UI strings in 14 components.
                </p>
                <p className="text-blue-400 mt-1">
                  Updated source:{" "}
                  <span className="text-ivory">messages/en.json</span> (38 keys)
                </p>
                <div className="my-3 border-t border-ash/40" />
                <p className="text-amber-300">
                  Translating 4 new strings via Gemini AI...
                </p>
                <p className="text-emerald-400 mt-1">
                  Merged into{" "}
                  <span className="text-ivory">messages/am.json</span> (Total:
                  38)
                </p>
                <p className="text-emerald-400 mt-0.5">
                  Merged into{" "}
                  <span className="text-ivory">messages/om.json</span> (Total:
                  38)
                </p>
                <p className="text-emerald-400 mt-0.5">
                  Merged into{" "}
                  <span className="text-ivory">messages/ti.json</span> (Total:
                  38)
                </p>
                <div className="mt-4 rounded-xl border border-emerald-800/40 bg-emerald-950/50 px-4 py-3 font-semibold text-emerald-300">
                  Sync complete. Dictionaries ready for next-intl / i18next.
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Language Support Strip (below hero, not inside it) ─────────────── */}
      <section className="border-b border-ash/40 bg-obsidian/50 py-5">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate">
              Supported languages
            </span>
            <div className="flex flex-wrap gap-3">
              {[
                { code: "am", name: "Amharic", native: "አማርኛ" },
                { code: "om", name: "Afaan Oromo", native: "Oromiffa" },
                { code: "ti", name: "Tigrinya", native: "ትግርኛ" },
              ].map((lang) => (
                <span
                  key={lang.code}
                  className="flex items-center gap-2 rounded-xl border border-ash bg-onyx px-3 py-1.5 text-xs text-ivory"
                >
                  <span className="font-mono text-[10px] uppercase tracking-wide text-blood">
                    {lang.code}
                  </span>
                  <span>{lang.name}</span>
                  <span className="font-mono text-silver">{lang.native}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works (#workflow) — Vertical Timeline ───────────────────── */}
      <section
        id="workflow"
        className="py-20 md:py-28 border-b border-ash/40"
      >
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="mb-16">
            <h2 className="text-3xl font-bold tracking-tighter text-ivory sm:text-4xl">
              How QalSync Works
            </h2>
            <p className="mt-3 max-w-xl text-sm text-silver leading-relaxed">
              Add localization to any React app in under two minutes. No manual
              JSON files, no translation spreadsheets.
            </p>
          </Reveal>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical connector */}
            <div className="absolute left-5 top-5 bottom-5 w-px bg-gradient-to-b from-blood/40 via-ash to-ash/20" />

            <div className="space-y-14">
              {[
                {
                  step: "01",
                  title: "Initialize Config",
                  desc: "Run npx qalsync init. Select your target languages. A qalsync.config.ts is generated with your project ID and locale list.",
                  codeComment: "// qalsync.config.ts",
                  code: 'targetLocales: ["am", "om", "ti"]',
                  codeColor: "text-blood-glow",
                },
                {
                  step: "02",
                  title: "Write Normal JSX",
                  desc: "Write standard React components. QalSync's AST parser automatically discovers all user-facing text strings, labels, placeholders, and titles.",
                  codeComment: "// your React component",
                  code: "<Button>Save Changes</Button>",
                  codeColor: "text-bone",
                },
                {
                  step: "03",
                  title: "Run Sync",
                  desc: "Run npx qalsync sync. New strings go to Gemini AI. Translations merge directly into messages/*.json, ready for next-intl or i18next.",
                  codeComment: "// messages/am.json",
                  code: '"Save Changes": "ለውጦችን አስቀምጥ"',
                  codeColor: "text-emerald-400",
                },
              ].map((item, i) => (
                <Reveal
                  key={item.step}
                  delay={i * 0.09}
                  slideX
                  className="relative flex gap-8 pl-14"
                >
                  {/* Step number — sits on the line */}
                  <div className="absolute left-0 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-blood/40 bg-blood/10 font-mono text-sm font-bold text-blood">
                    {item.step}
                  </div>

                  <div className="flex-1 pt-1.5">
                    <h3 className="text-lg font-bold text-ivory">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-lg text-sm text-silver leading-relaxed">
                      {item.desc}
                    </p>
                    <div className="mt-4 max-w-xs rounded-xl border border-ash/60 bg-onyx p-4 font-mono text-[11px]">
                      <p className="text-slate mb-1">{item.codeComment}</p>
                      <p className={item.codeColor}>{item.code}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features (#features) — Bento Grid ────────────────────────────── */}
      <section
        id="features"
        className="py-20 md:py-28 border-b border-ash/40 bg-obsidian/30"
      >
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="mb-12">
            <h2 className="text-3xl font-bold tracking-tighter text-ivory sm:text-4xl">
              Engineered for Speed and Accuracy
            </h2>
            <p className="mt-3 max-w-lg text-sm text-silver leading-relaxed">
              Every layer of the pipeline is optimized to minimize API calls and
              maximize translation quality.
            </p>
          </Reveal>

          {/* Bento: 3-col grid, 3 rows — 6 cells, no empties */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            {/* Cell 1: AST Scanner — large (col-span-2), tinted bg */}
            <Reveal className="md:col-span-2" delay={0}>
              <div className="h-full rounded-2xl border border-blood/20 bg-blood/5 p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-blood/30 bg-blood/15">
                  <MagnifyingGlass
                    size={20}
                    weight="duotone"
                    className="text-blood"
                  />
                </div>
                <h3 className="text-base font-bold text-ivory mb-2">
                  AST Codebase Scanner
                </h3>
                <p className="text-sm text-silver leading-relaxed max-w-xs">
                  Parses TypeScript and JSX ASTs to find user-facing text,
                  placeholders, labels, and titles automatically.
                </p>
                <div className="mt-5 rounded-xl border border-ash/50 bg-onyx/80 p-3 font-mono text-[11px] text-bone">
                  <p className="text-slate">$ npx qalsync sync --dir ./src/app</p>
                  <p className="text-emerald-400 mt-1">
                    Found 312 strings in 84 components.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Cell 2: Gemini AI */}
            <Reveal delay={0.06}>
              <div className="h-full rounded-2xl border border-ash bg-onyx/60 p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-ash bg-obsidian">
                  <Cpu size={20} weight="duotone" className="text-blood-glow" />
                </div>
                <h3 className="text-base font-bold text-ivory mb-2">
                  Gemini AI Context Engine
                </h3>
                <p className="text-sm text-silver leading-relaxed">
                  Tuned for Amharic, Afaan Oromo, and Tigrinya. Natural,
                  contemporary phrasing for low-resource languages.
                </p>
              </div>
            </Reveal>

            {/* Cell 3: Caching */}
            <Reveal delay={0.04}>
              <div className="h-full rounded-2xl border border-ash bg-onyx/60 p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-ash bg-obsidian">
                  <Lightning
                    size={20}
                    weight="duotone"
                    className="text-blood-glow"
                  />
                </div>
                <h3 className="text-base font-bold text-ivory mb-2">
                  2-Level Incremental Caching
                </h3>
                <p className="text-sm text-silver leading-relaxed">
                  Local JSON plus Supabase PostgreSQL. Never pay for the same
                  translation twice.
                </p>
              </div>
            </Reveal>

            {/* Cell 4: Human Review */}
            <Reveal delay={0.08}>
              <div className="h-full rounded-2xl border border-ash bg-onyx/60 p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-ash bg-obsidian">
                  <Users
                    size={20}
                    weight="duotone"
                    className="text-blood-glow"
                  />
                </div>
                <h3 className="text-base font-bold text-ivory mb-2">
                  Human Review Portal
                </h3>
                <p className="text-sm text-silver leading-relaxed">
                  Web dashboard for translators to review, edit, and approve AI
                  translation drafts.
                </p>
              </div>
            </Reveal>

            {/* Cell 5: i18n Compat */}
            <Reveal delay={0.12}>
              <div className="h-full rounded-2xl border border-ash bg-onyx/60 p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-ash bg-obsidian">
                  <Translate
                    size={20}
                    weight="duotone"
                    className="text-blood-glow"
                  />
                </div>
                <h3 className="text-base font-bold text-ivory mb-2">
                  Standard i18n Compatibility
                </h3>
                <p className="text-sm text-silver leading-relaxed">
                  Output JSON is 100% compatible with next-intl, i18next, and
                  custom translation hooks.
                </p>
              </div>
            </Reveal>

            {/* Cell 6: CI/CD Guard — full width (col-span-3), visually distinct */}
            <Reveal delay={0.1} className="md:col-span-3">
              <div className="flex flex-col gap-5 rounded-2xl border border-ash bg-onyx p-6 md:flex-row md:items-center md:gap-8">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-success/30 bg-success/10">
                  <ShieldCheck
                    size={20}
                    weight="duotone"
                    className="text-success"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-ivory mb-1">
                    CI/CD Automated Guard
                  </h3>
                  <p className="text-sm text-silver leading-relaxed max-w-lg">
                    Fail builds if any untranslated strings exist. Drop into any
                    GitHub Actions pipeline with one command.
                  </p>
                </div>
                <div className="shrink-0 rounded-xl border border-ash/60 bg-obsidian px-5 py-3 font-mono text-xs text-bone">
                  <span className="text-blood">$</span>{" "}
                  <span className="text-ivory">npx qalsync sync --check</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CLI Reference (#cli) ───────────────────────────────────────────── */}
      <section id="cli" className="py-20 md:py-28 border-b border-ash/40">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="mb-12">
            <h2 className="text-3xl font-bold tracking-tighter text-ivory">
              CLI Reference
            </h2>
            <p className="mt-2 text-sm text-silver">
              Simple, memorable commands for your terminal.
            </p>
          </Reveal>

          {/* Tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            {(["sync", "init", "check", "review"] as const).map((tab) => (
              <button
                key={tab}
                id={`cli-tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-4 py-2 font-mono text-xs font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-blood text-white shadow-md shadow-blood/20"
                    : "border border-ash bg-obsidian text-silver hover:border-slate hover:text-ivory"
                }`}
              >
                {tab === "sync" && "qalsync sync"}
                {tab === "init" && "qalsync init"}
                {tab === "check" && "qalsync sync --check"}
                {tab === "review" && "qalsync review"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="max-w-3xl rounded-2xl border border-ash bg-obsidian p-6 shadow-xl">
            {activeTab === "sync" && (
              <div>
                <h3 className="mb-2 font-mono text-base font-bold text-ivory">
                  npx qalsync sync
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-silver">
                  Scans your codebase for UI strings, compares with existing
                  dictionaries and database cache, translates only new strings
                  via Gemini AI, and merges JSON files into{" "}
                  <code className="font-mono text-blood-glow">
                    messages/*.json
                  </code>
                  .
                </p>
                <div className="rounded-xl border border-ash/60 bg-onyx p-3 font-mono text-xs text-bone">
                  <p className="text-silver">$ npx qalsync sync</p>
                  <p className="mt-1 text-slate">
                    // Options: --dir ./src/app --locale am --project-id my-app
                  </p>
                </div>
              </div>
            )}
            {activeTab === "init" && (
              <div>
                <h3 className="mb-2 font-mono text-base font-bold text-ivory">
                  npx qalsync init
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-silver">
                  Creates{" "}
                  <code className="font-mono text-blood-glow">
                    qalsync.config.ts
                  </code>{" "}
                  with your project ID (auto-detected from package.json) and
                  interactively prompts for target languages.
                </p>
                <div className="rounded-xl border border-ash/60 bg-onyx p-3 font-mono text-xs text-bone">
                  <p className="text-silver">$ npx qalsync init</p>
                  <p className="mt-1 text-slate">
                    // Skip prompts: npx qalsync init -l am,om,ti
                  </p>
                </div>
              </div>
            )}
            {activeTab === "check" && (
              <div>
                <h3 className="mb-2 font-mono text-base font-bold text-ivory">
                  npx qalsync sync --check
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-silver">
                  CI mode: verifies all codebase strings are translated. Exits
                  with code{" "}
                  <code className="font-mono text-red-400">1</code> if missing
                  translations are found.
                </p>
                <div className="rounded-xl border border-ash/60 bg-onyx p-3 font-mono text-xs text-bone">
                  <p className="text-silver">$ npx qalsync sync --check</p>
                  <p className="mt-1 text-slate">
                    // Use in GitHub Actions pipeline steps
                  </p>
                </div>
              </div>
            )}
            {activeTab === "review" && (
              <div>
                <h3 className="mb-2 font-mono text-base font-bold text-ivory">
                  npx qalsync review
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-silver">
                  Opens the QalSync Review Dashboard in your browser for human
                  verification and edits.
                </p>
                <div className="rounded-xl border border-ash/60 bg-onyx p-3 font-mono text-xs text-bone">
                  <p className="text-silver">$ npx qalsync review</p>
                  <p className="mt-1 text-slate">
                    Opening http://localhost:3000/review...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-ash/60 bg-void py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-blood/30 bg-blood/10 font-mono text-[11px] font-bold text-blood">
              Q
            </div>
            <span className="text-sm font-bold text-ivory">QalSync</span>
            <span className="text-xs text-slate">© 2026</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-silver">
            <Link
              href="/review"
              className="hover:text-ivory transition-colors"
            >
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
            <span className="rounded bg-ash/60 px-2 py-0.5 font-mono text-[10px] text-silver">
              MIT License
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
