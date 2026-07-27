import * as fs from "fs";
import * as path from "path";

export interface TranslationDictionary {
  [key: string]: string;
}

export class JsonManager {
  private messagesDir: string;

  constructor(messagesDir: string) {
    this.messagesDir = path.resolve(process.cwd(), messagesDir);
  }

  public ensureMessagesDirExists(): void {
    if (!fs.existsSync(this.messagesDir)) {
      fs.mkdirSync(this.messagesDir, { recursive: true });
    }
  }

  public getLocaleFilePath(locale: string): string {
    return path.join(this.messagesDir, `${locale}.json`);
  }

  public readDictionary(locale: string): TranslationDictionary {
    const filePath = this.getLocaleFilePath(locale);
    if (!fs.existsSync(filePath)) {
      return {};
    }
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) as TranslationDictionary;
    } catch {
      return {};
    }
  }

  public writeDictionary(locale: string, dict: TranslationDictionary): string {
    this.ensureMessagesDirExists();
    const filePath = this.getLocaleFilePath(locale);
    const formattedJson = JSON.stringify(dict, null, 2);
    fs.writeFileSync(filePath, formattedJson, "utf-8");
    return filePath;
  }

  /**
   * Identifies extracted strings that are NOT yet in the local target dictionary.
   */
  public findUntranslatedStrings(
    extractedStrings: string[],
    targetLocale: string
  ): string[] {
    const existing = this.readDictionary(targetLocale);
    return extractedStrings.filter((s) => existing[s] === undefined);
  }


  /**
   * Syncs source locale dictionary (e.g. en.json) with extracted strings.
   */
  public syncSourceDictionary(
    extractedStrings: string[],
    sourceLocale: string = "en"
  ): number {
    const dict = this.readDictionary(sourceLocale);
    let addedCount = 0;

    for (const str of extractedStrings) {
      if (!dict[str]) {
        dict[str] = str;
        addedCount++;
      }
    }

    this.writeDictionary(sourceLocale, dict);
    return addedCount;
  }

  /**
   * Merges new translations into a target locale dictionary (e.g. am.json or om.json).
   */
  public mergeTranslations(
    newTranslations: Record<string, string>,
    targetLocale: string
  ): { total: number; merged: number } {
    const dict = this.readDictionary(targetLocale);
    let merged = 0;

    for (const [sourceText, translatedText] of Object.entries(newTranslations)) {
      if (translatedText && dict[sourceText] !== translatedText) {
        dict[sourceText] = translatedText;
        merged++;
      }
    }

    this.writeDictionary(targetLocale, dict);
    return {
      total: Object.keys(dict).length,
      merged,
    };
  }
}
