import * as fs from "fs";
import * as path from "path";
import ts from "typescript";

export interface ScanOptions {
  extensions?: string[];
  excludeDirs?: string[];
}

const DEFAULT_EXTENSIONS = [".tsx", ".jsx", ".ts", ".js"];
const DEFAULT_EXCLUDE_DIRS = [
  "node_modules",
  ".next",
  "dist",
  "build",
  ".git",
  "coverage",
];

const TARGET_ATTRIBUTES = new Set([
  "placeholder",
  "alt",
  "title",
  "label",
  "aria-label",
  "description",
  "caption",
  "tooltip",
  "headerText",
  "buttonText",
]);

const TARGET_FUNCTIONS = new Set(["translate", "t", "formatMessage"]);

/**
 * Heuristic check to filter out non-translatable text (e.g. CSS classes, URLs, symbols).
 */
export function isTranslatableString(str: string): boolean {
  const trimmed = str.trim();
  if (!trimmed || trimmed.length < 2) return false;

  // URLs, paths, imports, hex colors
  if (/^(https?:\/\/|\/|mailto:|#[0-9a-fA-F]{3,8}|\.\/|\.\.\/)/.test(trimmed)) {
    return false;
  }

  // Pure numbers or single punctuation symbols
  if (/^[0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?✓✕⚠]+$/.test(trimmed)) {
    return false;
  }

  // Tailwind CSS classes heuristic
  if (
    /^(flex|grid|block|inline|hidden|relative|absolute|fixed|sticky|w-|h-|p-|m-|px-|py-|mx-|my-|text-|bg-|border-|rounded-|shadow-|focus:|hover:)/.test(
      trimmed
    )
  ) {
    return false;
  }

  // Must contain at least one letter
  if (!/[a-zA-Z\u00C0-\u024F\u1200-\u137F]/.test(trimmed)) {
    return false;
  }

  return true;
}

/**
 * Parse a source file AST and extract translatable strings.
 */
export function extractStringsFromFile(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const extension = path.extname(filePath).toLowerCase();

  let scriptKind = ts.ScriptKind.Unknown;
  if (extension === ".tsx") scriptKind = ts.ScriptKind.TSX;
  else if (extension === ".jsx") scriptKind = ts.ScriptKind.JSX;
  else if (extension === ".ts") scriptKind = ts.ScriptKind.TS;
  else if (extension === ".js") scriptKind = ts.ScriptKind.JS;

  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );

  const extractedStrings = new Set<string>();

  function visit(node: ts.Node) {
    // 1. JSX Text element (<h1>Hello World</h1>)
    if (ts.isJsxText(node)) {
      const text = node.getText().trim();
      // Remove newline indentation
      const normalized = text.replace(/\s+/g, " ");
      if (isTranslatableString(normalized)) {
        extractedStrings.add(normalized);
      }
    }

    // 2. JSX Attribute (placeholder="Search...", alt="Avatar")
    if (ts.isJsxAttribute(node)) {
      const attrName = node.name.getText();
      if (TARGET_ATTRIBUTES.has(attrName) && node.initializer) {
        if (ts.isStringLiteral(node.initializer)) {
          const val = node.initializer.text.trim();
          if (isTranslatableString(val)) extractedStrings.add(val);
        } else if (
          ts.isJsxExpression(node.initializer) &&
          node.initializer.expression &&
          ts.isStringLiteral(node.initializer.expression)
        ) {
          const val = node.initializer.expression.text.trim();
          if (isTranslatableString(val)) extractedStrings.add(val);
        }
      }
    }

    // 3. Call expressions: t("Hello") or translate("Hello")
    if (ts.isCallExpression(node)) {
      const fnName = node.expression.getText();
      if (TARGET_FUNCTIONS.has(fnName) && node.arguments.length > 0) {
        const firstArg = node.arguments[0];
        if (ts.isStringLiteral(firstArg)) {
          const val = firstArg.text.trim();
          if (isTranslatableString(val)) extractedStrings.add(val);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return Array.from(extractedStrings);
}

/**
 * Recursively scan directory for source files and extract translatable strings.
 */
export function scanProjectStrings(
  dirPath: string,
  options?: ScanOptions
): string[] {
  const extensions = options?.extensions ?? DEFAULT_EXTENSIONS;
  const excludeDirs = options?.excludeDirs ?? DEFAULT_EXCLUDE_DIRS;

  const allExtracted = new Set<string>();

  function walk(currentPath: string) {
    if (!fs.existsSync(currentPath)) return;

    const stat = fs.statSync(currentPath);

    if (stat.isDirectory()) {
      const baseName = path.basename(currentPath);
      if (excludeDirs.includes(baseName)) return;

      const children = fs.readdirSync(currentPath);
      for (const child of children) {
        walk(path.join(currentPath, child));
      }
    } else if (stat.isFile()) {
      const ext = path.extname(currentPath).toLowerCase();
      if (extensions.includes(ext)) {
        const fileStrings = extractStringsFromFile(currentPath);
        for (const s of fileStrings) {
          allExtracted.add(s);
        }
      }
    }
  }

  walk(path.resolve(dirPath));
  return Array.from(allExtracted);
}
