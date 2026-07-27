#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { scanProjectStrings } from "./scanner.js";
import { translateBatch } from "./index.js";
import { loadConfig, generateDefaultConfigFile, type QalSyncConfig } from "./config.js";
import { JsonManager } from "./json-manager.js";

import * as readline from "readline";

function printHelp() {
  console.log(`
QalSync CLI — Zero-friction localization toolchain for React & Next.js

Usage:
  npx qalsync [command] [options]

Commands:
  init                  Initialize qalsync.config.ts and messages/ directory
  sync                  Scan codebase, diff strings, translate new text, merge JSON files
  review (or dashboard) Open the QalSync human review dashboard in your browser
  scan                  Scan codebase text and save raw strings JSON

Options:
  --check               CI mode for sync: exits code 1 if untranslated strings exist
  --dir, -d <path>      Source directory to scan (default: from config or ./app)
  --locale, -l <code>   Target locale override or selection (e.g. am, om, ti)
  --project-id <id>     Project ID override (default: from config)
  --api-url <url>       QalSync API URL override (default: http://localhost:3000)
  --help, -h            Show this help message

Examples:
  npx qalsync init
  npx qalsync init -l am,ti
  npx qalsync sync
  npx qalsync sync --check
  npx qalsync review
`);
}

function openBrowser(url: string) {
  console.log(`🚀 Opening QalSync Review Dashboard at: ${url}`);
  const command =
    process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;

  exec(command, (err) => {
    if (err) {
      console.log(`🔗 Open dashboard manually at: ${url}`);
    }
  });
}

async function promptLocales(): Promise<string[]> {
  if (!process.stdin.isTTY) {
    return ["am", "om", "ti"];
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n🌐 Select target languages to support:");
  console.log("  1) All: Amharic (am), Afaan Oromo (om), Tigrinya (ti) [Default]");
  console.log("  2) Amharic (am) & Afaan Oromo (om)");
  console.log("  3) Amharic (am) & Tigrinya (ti)");
  console.log("  4) Amharic (am) only");
  console.log("  5) Afaan Oromo (om) only");
  console.log("  6) Tigrinya (ti) only");
  console.log("  7) Custom (enter comma-separated codes, e.g. am,ti)\n");

  return new Promise((resolve) => {
    rl.question("Enter choice (1-7) [1]: ", (answer) => {
      rl.close();
      const choice = answer.trim();
      if (choice === "2") resolve(["am", "om"]);
      else if (choice === "3") resolve(["am", "ti"]);
      else if (choice === "4") resolve(["am"]);
      else if (choice === "5") resolve(["om"]);
      else if (choice === "6") resolve(["ti"]);
      else if (choice === "7" || choice.includes(",")) {
        const codes = choice.split(",").map((c) => c.trim()).filter(Boolean);
        resolve(codes.length > 0 ? codes : ["am", "om", "ti"]);
      } else {
        resolve(["am", "om", "ti"]);
      }
    });
  });
}

async function handleInit(projectRoot: string, localesOverride?: string) {
  console.log("⚙️  [QalSync] Initializing QalSync configuration...");

  let targetLocales: string[] = ["am", "om", "ti"];

  if (localesOverride) {
    targetLocales = localesOverride.split(",").map((s) => s.trim()).filter(Boolean);
  } else {
    targetLocales = await promptLocales();
  }

  const configPath = generateDefaultConfigFile(projectRoot, { targetLocales });
  const jsonManager = new JsonManager("messages");
  jsonManager.ensureMessagesDirExists();

  console.log(`\n✅ Target languages configured: ${targetLocales.join(", ")}`);
  console.log(`✅ Created configuration file: ${configPath}`);
  console.log(`✅ Ensured messages directory: ${path.resolve(projectRoot, "messages")}`);
  console.log("\nNext step: Run 'npx qalsync sync' to extract & translate UI strings!");
}


async function handleSync(
  projectRoot: string,
  config: QalSyncConfig,
  isCheckOnly: boolean,
  localeOverride?: string
) {
  const targetDir = path.resolve(projectRoot, config.srcDir || "app");
  const fallbackDir = fs.existsSync(targetDir)
    ? targetDir
    : path.resolve(projectRoot, "src");

  if (!fs.existsSync(fallbackDir)) {
    console.error(`❌ Source directory not found: ${targetDir} or ${fallbackDir}`);
    process.exit(1);
  }

  console.log(`🔍 [QalSync] Scanning codebase at: ${fallbackDir}`);
  const extractedStrings = scanProjectStrings(fallbackDir);
  console.log(`✨ Found ${extractedStrings.length} total UI strings.`);

  const jsonManager = new JsonManager(config.messagesDir);
  jsonManager.ensureMessagesDirExists();

  // 1. Sync source locale dictionary (en.json)
  const newSourceCount = jsonManager.syncSourceDictionary(
    extractedStrings,
    config.sourceLocale
  );
  if (newSourceCount > 0) {
    console.log(`📁 Added ${newSourceCount} new source strings to ${config.messagesDir}/${config.sourceLocale}.json`);
  }

  const targetLocales = localeOverride
    ? [localeOverride]
    : config.targetLocales;

  let totalUntranslatedCount = 0;
  const missingByLocale: Record<string, string[]> = {};

  for (const locale of targetLocales) {
    const untranslated = jsonManager.findUntranslatedStrings(
      extractedStrings,
      locale
    );

    if (untranslated.length > 0) {
      totalUntranslatedCount += untranslated.length;
      missingByLocale[locale] = untranslated;
    }
  }

  if (isCheckOnly) {
    if (totalUntranslatedCount > 0) {
      console.error(
        `\n❌ [QalSync CI Check Failed] Found ${totalUntranslatedCount} untranslated strings across locales:`
      );
      for (const [loc, missing] of Object.entries(missingByLocale)) {
        console.error(`  - [${loc}]: ${missing.length} missing strings (e.g. "${missing[0]}")`);
      }
      console.error("\nRun 'npx qalsync sync' locally to translate missing strings.");
      process.exit(1);
    } else {
      console.log("\n✅ [QalSync CI Check Passed] All codebase UI strings are fully translated!");
      process.exit(0);
    }
  }

  // 2. Perform AI translations for untranslated strings
  for (const locale of targetLocales) {
    const untranslated = missingByLocale[locale] || [];

    if (untranslated.length === 0) {
      console.log(`✓ [${locale}] All ${extractedStrings.length} strings already translated in ${config.messagesDir}/${locale}.json`);
      continue;
    }

    console.log(
      `🌐 [${locale}] Translating ${untranslated.length} new strings via Gemini AI (project: '${config.projectId}')...`
    );

    try {
      const translationMap = await translateBatch(untranslated, locale, {
        apiUrl: config.apiUrl,
        projectId: config.projectId,
      });

      const { total, merged } = jsonManager.mergeTranslations(
        translationMap,
        locale
      );

      console.log(
        `✅ [${locale}] Merged ${merged} new translations into ${config.messagesDir}/${locale}.json (Total: ${total})`
      );
    } catch (err) {
      console.error(
        `❌ [${locale}] Translation failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  console.log("\n=========================================================");
  console.log("✅ QALSYNC SYNC COMPLETE");
  console.log("=========================================================");
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] && !args[0].startsWith("-") ? args[0] : "sync";
  const projectRoot = process.cwd();
  const config = loadConfig(projectRoot);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  // Parse command line overrides
  let localeOverride: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--locale" || args[i] === "-l") {
      localeOverride = args[++i];
    } else if (args[i] === "--api-url") {
      config.apiUrl = args[++i];
    } else if (args[i] === "--project-id") {
      config.projectId = args[++i];
    } else if (args[i] === "--dir" || args[i] === "-d") {
      config.srcDir = args[++i];
    }
  }

  switch (command) {
    case "init":
      await handleInit(projectRoot, localeOverride);
      break;


    case "sync":
      const isCheckOnly = args.includes("--check");
      await handleSync(projectRoot, config, isCheckOnly, localeOverride);
      break;

    case "review":
    case "dashboard":
      openBrowser(`${config.apiUrl}/review`);
      break;

    case "scan":
      const targetDir = path.resolve(projectRoot, config.srcDir || "app");
      const extracted = scanProjectStrings(targetDir);
      const jsonManager = new JsonManager(config.messagesDir);
      jsonManager.syncSourceDictionary(extracted, config.sourceLocale);
      console.log(`📁 Extracted ${extracted.length} strings to ${config.messagesDir}/${config.sourceLocale}.json`);
      break;

    default:
      printHelp();
      break;
  }
}

main().catch((err) => {
  console.error("❌ QalSync CLI error:", err);
  process.exit(1);
});
