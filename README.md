# QalSync

A localization toolchain for Next.js/React apps, focused on low-resource languages (Amharic, Afaan Oromo) that generic translation services handle poorly. Uses Gemini AI for initial translations and provides a human review workflow.

## Project Structure

```
/apps/backend       ← Next.js app (API routes + review dashboard)
/packages/client    ← QalSync CLI & SDK package
```

## Architecture & Workflow

![Sequence Diagram](apps/backend/public/sequence-diagram.png)

## Prerequisites

- Node.js ≥ 18
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- A [Supabase](https://supabase.com/) project
- A [Google AI / Gemini API key](https://aistudio.google.com/apikey)

## Environment Variables

Create `apps/backend/.env.local` with:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

## Database Setup

1. Go to your Supabase project → SQL Editor.
2. Run the migration files at `apps/backend/supabase/migrations/`.
3. Enable email/password auth in Supabase → Authentication → Providers → Email.

## Running Locally

```bash
# Install dependencies
pnpm install

# Start the Next.js dev server
pnpm dev
```

The app runs at `http://localhost:3000`.

- **API**: `POST /api/translate`, `GET /api/translations`, `PATCH /api/translations/:id`
- **Review dashboard**: `/review`

---

## Developer CLI Workflow

### 1. Initialize QalSync in your React / Next.js app

```bash
npx qalsync init
```

Creates `qalsync.config.ts` and a `messages/` folder in your project root:

```ts
// qalsync.config.ts
export default {
  sourceLocale: "en",
  targetLocales: ["am", "om"],
  messagesDir: "messages",
  srcDir: "app", // or "src"
  apiUrl: "http://localhost:3000",
  projectId: "default",
  approvedOnly: false,
};
```

### 2. Automatically Scan, AI-Translate & Sync

```bash
npx qalsync sync
```

**What it does:**
1. Scans `.tsx` and `.jsx` files for user-facing UI text using an AST parser.
2. Diffs extracted text against existing `messages/*.json` and Supabase DB cache.
3. Sends **ONLY brand-new, untranslated strings** to Google Gemini AI.
4. Merges generated translations directly into `messages/en.json`, `messages/am.json`, and `messages/om.json`.

**Output Summary:**
```text
✓ Scanned 84 files
✓ Found 312 strings
✓ 287 already translated
✓ 25 new strings sent to Gemini AI
✓ Merged translations into messages/am.json and messages/om.json
Done.
```

### 3. CI/CD Untranslated String Check

Run in your GitHub Actions / CI build pipeline:

```bash
npx qalsync sync --check
```

Fails with exit code `1` if any untranslated or missing strings exist in the codebase.

### 4. Optional Human Review Dashboard

```bash
npx qalsync review
```

Opens `http://localhost:3000/review` in your browser. Allows native speakers or translators to visually inspect, edit, and approve draft AI translations.

---

## API Reference

### `POST /api/translate`

Translate a single string or a batch of strings. Returns cached translations if available, otherwise calls Gemini AI and saves draft rows.

```json
// Batch Request
{
  "texts": ["Welcome back", "Save Changes"],
  "locale": "am",
  "projectId": "my-app"
}

// Batch Response
{
  "translations": {
    "Welcome back": { "translation": "እንኳን በደህና ተመለሱ", "reviewed": true, "id": "uuid-1" },
    "Save Changes": { "translation": "ለውጦችን አስቀምጥ", "reviewed": false, "id": "uuid-2" }
  }
}
```

### `GET /api/translations?projectId=...&locale=...&status=draft`

List translations with optional query filters.

### `PATCH /api/translations/:id`

Update a translation text and/or mark it as `approved`.

### `DELETE /api/translations/:id`

Delete a translation entry.

---

## Supported Languages

| Code | Language |
|---|---|
| `am` | Amharic (አማርኛ) |
| `om` | Afaan Oromo |

More languages can be added by extending the prompt in `apps/backend/src/lib/gemini.ts`.
