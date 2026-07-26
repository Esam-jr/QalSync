#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { scanProjectStrings } from "./scanner.js";
import { translateBatch } from "./index.js";


function parseArgs(args: string[]) {
  const options: Record<string, string | boolean> = {
    dir: "./",
    out: "qalsync.strings.json",
    translate: false,
    apiUrl: process.env.QALSYNC_API_URL ?? "http://localhost:3000",
    projectId: process.env.QALSYNC_PROJECT_ID ?? "default",
    locale: process.env.QALSYNC_LOCALE ?? "am",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--translate" || arg === "-t") {
      options.translate = true;
    } else if (arg === "--out" || arg === "-o") {
      options.out = args[++i];
    } else if (arg === "--dir" || arg === "-d") {
      options.dir = args[++i];
    } else if (arg === "--api-url") {
      options.apiUrl = args[++i];
    } else if (arg === "--project-id") {
      options.projectId = args[++i];
    } else if (arg === "--locale" || arg === "-l") {
      options.locale = args[++i];
    } else if (!arg.startsWith("-") && i === 0) {
      options.dir = arg;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
QalSync Codebase Scanner CLI

Scans .tsx, .jsx, .ts, and .js files in a React/Next.js codebase and extracts user-facing strings for localization.

Usage:
  npx qalsync-scan [dir] [options]

Options:
  --dir, -d <path>      Directory to scan (default: current directory or ./src)
  --out, -o <filename>  Output JSON filename (default: qalsync.strings.json)
  --translate, -t       Automatically translate extracted strings via QalSync API
  --api-url <url>       QalSync API URL (default: http://localhost:3000)
  --project-id <id>     Project ID (default: default)
  --locale, -l <code>   Target locale (default: am)
  --help, -h            Show this help message

Examples:
  npx qalsync-scan ./src
  npx qalsync-scan ./src --out strings.json
  npx qalsync-scan ./src --translate --locale am --project-id my-app
`);
}

async function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  const targetDir = path.resolve(String(opts.dir));
  console.log(`🔍 [QalSync] Scanning codebase at: ${targetDir}`);

  if (!fs.existsSync(targetDir)) {
    console.error(`❌ Directory not found: ${targetDir}`);
    process.exit(1);
  }

  const extractedStrings = scanProjectStrings(targetDir);
  console.log(`✨ Found ${extractedStrings.length} translatable strings.`);

  const outputPath = path.resolve(String(opts.out));

  if (opts.translate) {
    console.log(
      `🌐 Auto-translating ${extractedStrings.length} strings to locale '${opts.locale}' using project '${opts.projectId}'...`
    );

    try {
      const translationMap = await translateBatch(
        extractedStrings,
        String(opts.locale),
        {
          apiUrl: String(opts.apiUrl),
          projectId: String(opts.projectId),
        }
      );

      const outputData = {
        locale: opts.locale,
        projectId: opts.projectId,
        count: extractedStrings.length,
        translations: translationMap,
      };

      fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), "utf-8");
      console.log(
        `✅ Successfully auto-translated and saved results to: ${outputPath}`
      );
    } catch (err) {
      console.error(
        `❌ Auto-translation failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      // Fallback: save raw extracted strings
      saveStringsJson(extractedStrings, outputPath);
    }
  } else {
    saveStringsJson(extractedStrings, outputPath);
  }
}

function saveStringsJson(extractedStrings: string[], outputPath: string) {
  const outputData = {
    count: extractedStrings.length,
    strings: extractedStrings,
  };
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), "utf-8");
  console.log(`📁 Extracted strings saved to: ${outputPath}`);
}

main().catch((err) => {
  console.error("❌ Scanner CLI encountered an error:", err);
  process.exit(1);
});
