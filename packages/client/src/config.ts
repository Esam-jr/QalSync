import * as fs from "fs";
import * as path from "path";

export interface QalSyncConfig {
  sourceLocale: string;
  targetLocales: string[];
  messagesDir: string;
  srcDir: string;
  apiUrl: string;
  projectId: string;
  approvedOnly: boolean;
}

export const DEFAULT_CONFIG: QalSyncConfig = {
  sourceLocale: "en",
  targetLocales: ["am", "om"],
  messagesDir: "messages",
  srcDir: "app",
  apiUrl: process.env.QALSYNC_API_URL ?? "http://localhost:3000",
  projectId: process.env.QALSYNC_PROJECT_ID ?? "default",
  approvedOnly: false,
};

export function loadConfig(projectRoot: string = process.cwd()): QalSyncConfig {
  // Check for qalsync.config.json or qalsync.config.js or fallback to defaults
  const jsonPath = path.resolve(projectRoot, "qalsync.config.json");
  if (fs.existsSync(jsonPath)) {
    try {
      const raw = fs.readFileSync(jsonPath, "utf-8");
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...parsed };
    } catch {
      // Fallback
    }
  }

  const tsConfigPath = path.resolve(projectRoot, "qalsync.config.ts");
  if (fs.existsSync(tsConfigPath)) {
    try {
      const content = fs.readFileSync(tsConfigPath, "utf-8");
      const configObj: Partial<QalSyncConfig> = {};

      const sourceMatch = content.match(/sourceLocale:\s*["']([^"']+)["']/);
      if (sourceMatch) configObj.sourceLocale = sourceMatch[1];

      const targetMatch = content.match(/targetLocales:\s*\[([^\]]+)\]/);
      if (targetMatch) {
        configObj.targetLocales = targetMatch[1]
          .split(",")
          .map((s) => s.trim().replace(/["']/g, ""))
          .filter(Boolean);
      }

      const messagesMatch = content.match(/messagesDir:\s*["']([^"']+)["']/);
      if (messagesMatch) configObj.messagesDir = messagesMatch[1];

      const srcMatch = content.match(/srcDir:\s*["']([^"']+)["']/);
      if (srcMatch) configObj.srcDir = srcMatch[1];

      const apiMatch = content.match(/apiUrl:\s*["']([^"']+)["']/);
      if (apiMatch) configObj.apiUrl = apiMatch[1];

      const projectMatch = content.match(/projectId:\s*["']([^"']+)["']/);
      if (projectMatch) configObj.projectId = projectMatch[1];

      const approvedMatch = content.match(/approvedOnly:\s*(true|false)/);
      if (approvedMatch) configObj.approvedOnly = approvedMatch[1] === "true";

      return { ...DEFAULT_CONFIG, ...configObj };
    } catch {
      // Fallback
    }
  }

  return DEFAULT_CONFIG;
}

export function generateDefaultConfigFile(
  projectRoot: string = process.cwd(),
  overrides: Partial<QalSyncConfig> = {}
): string {
  let detectedProjectId = "my-app";

  try {
    const pkgPath = path.resolve(projectRoot, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      if (pkg.name) {
        // Sanitize package name (remove scope @org/name -> name)
        detectedProjectId = pkg.name.replace(/^@[^/]+\//, "").replace(/[^a-zA-Z0-9_-]/g, "-");
      }
    } else {
      detectedProjectId = path.basename(projectRoot).replace(/[^a-zA-Z0-9_-]/g, "-");
    }
  } catch {
    // Fallback
  }

  const config = {
    ...DEFAULT_CONFIG,
    projectId: detectedProjectId,
    ...overrides,
  };
  const targetLocalesStr = JSON.stringify(config.targetLocales);

  const fileContent = `// QalSync Configuration File
export default {
  sourceLocale: "${config.sourceLocale}",
  targetLocales: ${targetLocalesStr},
  messagesDir: "${config.messagesDir}",
  srcDir: "${config.srcDir}",
  apiUrl: "${config.apiUrl}",
  projectId: "${config.projectId}",
  approvedOnly: ${config.approvedOnly},
};
`;

  const configPath = path.resolve(projectRoot, "qalsync.config.ts");
  fs.writeFileSync(configPath, fileContent, "utf-8");

  // Also write json version for simple zero-dep reading if needed
  const jsonPath = path.resolve(projectRoot, "qalsync.config.json");
  fs.writeFileSync(jsonPath, JSON.stringify(config, null, 2), "utf-8");

  return configPath;
}
