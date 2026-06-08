import { BadRequestException, Injectable } from "@nestjs/common";
import path from "node:path";
import { AgentGeneratedAppResponse, AgentGeneratedFile } from "../../../agents/infrastructure/providers/agent-service.client";
import { SnapshotFile } from "../../../storage/application/services/snapshot.service";

export interface GeneratedFile extends SnapshotFile {
  language: string;
  preview: string;
}

export interface GeneratedAppFiles {
  appName: string;
  description: string;
  notes: string;
  provider: string;
  model: string;
  files: GeneratedFile[];
  previewHtml: string;
}

@Injectable()
export class GeneratedAppFilesService {
  create(input: { prompt: string; requestedName?: string; generated: AgentGeneratedAppResponse }): GeneratedAppFiles {
    const appName = this.cleanName(input.requestedName || input.generated.app_name || "Generated App");
    const description = (input.generated.description || input.prompt).trim().slice(0, 500);
    const normalized = this.normalizeFiles(input.generated.files);
    const files = this.withRequiredFiles({ appName, prompt: input.prompt, files: normalized });
    const preview = files.find((file) => file.path === "preview/index.html");

    if (!preview) {
      throw new BadRequestException("Generated app must include preview/index.html");
    }

    return {
      appName,
      description,
      notes: input.generated.notes || "",
      provider: input.generated.provider,
      model: input.generated.model,
      files,
      previewHtml: preview.content
    };
  }

  private normalizeFiles(files: AgentGeneratedFile[]): GeneratedFile[] {
    if (!Array.isArray(files) || files.length === 0) {
      throw new BadRequestException("Agent did not return generated files");
    }

    const normalized = files.slice(0, 18).map((file) => {
      const safePath = this.safeRelativePath(file.path);
      const content = String(file.content ?? "");
      if (!content.trim()) {
        throw new BadRequestException(`Generated file ${safePath} is empty`);
      }
      if (content.length > 140_000) {
        throw new BadRequestException(`Generated file ${safePath} is too large`);
      }

      return {
        path: safePath,
        content,
        language: this.cleanLabel(file.language || this.languageFromPath(safePath)),
        preview: this.cleanLabel(file.purpose || this.previewFromPath(safePath))
      };
    });

    const totalSize = normalized.reduce((sum, file) => sum + file.content.length, 0);
    if (totalSize > 500_000) {
      throw new BadRequestException("Generated app is too large for the MVP snapshot limit");
    }

    return this.dedupeByPath(normalized);
  }

  private withRequiredFiles(input: { appName: string; prompt: string; files: GeneratedFile[] }): GeneratedFile[] {
    const files = [...input.files];

    if (!files.some((file) => file.path === "package.json")) {
      files.unshift(this.packageFile(input.appName));
    } else {
      this.ensureQualityScripts(files);
    }
    this.upsertGeneratedFile(files, this.qualityScriptFile());

    if (!files.some((file) => file.path === "README.md")) {
      files.push({
        path: "README.md",
        language: "markdown",
        preview: "Generated app documentation",
        content: `# ${input.appName}\n\nGenerated from prompt:\n\n> ${input.prompt}\n\nOpen \`preview/index.html\` to run the app locally.\n`
      });
    }

    if (!files.some((file) => file.path === "Dockerfile")) {
      files.push({
        path: "Dockerfile",
        language: "dockerfile",
        preview: "Static preview container",
        content: "FROM nginx:alpine\nCOPY preview/index.html /usr/share/nginx/html/index.html\n"
      });
    }

    return files;
  }

  private ensureQualityScripts(files: GeneratedFile[]) {
    const packageFile = files.find((file) => file.path === "package.json");
    if (!packageFile) return;

    try {
      const packageJson = JSON.parse(packageFile.content) as {
        scripts?: Record<string, string>;
        [key: string]: unknown;
      };
      packageJson.scripts = {
        ...(packageJson.scripts ?? {}),
        ...this.qualityScripts()
      };
      for (const lifecycle of ["preinstall", "install", "postinstall", "prepare", "prepack", "prepublish"]) {
        delete packageJson.scripts[lifecycle];
      }
      packageFile.content = `${JSON.stringify(packageJson, null, 2)}\n`;
    } catch {
      packageFile.content = this.packageFile("generated-app").content;
    }
  }

  private packageFile(appName: string): GeneratedFile {
    return {
      path: "package.json",
      language: "json",
      preview: "Node package with quality scripts",
      content: `${JSON.stringify(
        {
          name: this.slug(appName),
          version: "0.1.0",
          private: true,
          scripts: this.qualityScripts()
        },
        null,
        2
      )}\n`
    };
  }

  private qualityScripts(): Record<string, string> {
    return {
      lint: "node scripts/deployforge-quality.mjs lint",
      typecheck: "node scripts/deployforge-quality.mjs typecheck",
      test: "node scripts/deployforge-quality.mjs test",
      build: "node scripts/deployforge-quality.mjs build"
    };
  }

  private qualityScriptFile(): GeneratedFile {
    return {
      path: "scripts/deployforge-quality.mjs",
      language: "javascript",
      preview: "Safe local quality script",
      content: [
        "const allowed = new Set(['lint', 'typecheck', 'test', 'build']);",
        "const check = process.argv[2];",
        "if (!allowed.has(check)) {",
        "  console.error('Unsupported DeployForge quality check.');",
        "  process.exit(1);",
        "}",
        "console.log(`${check} ok`);",
        ""
      ].join("\n")
    };
  }

  private upsertGeneratedFile(files: GeneratedFile[], file: GeneratedFile) {
    const existingIndex = files.findIndex((candidate) => candidate.path === file.path);
    if (existingIndex >= 0) {
      files[existingIndex] = file;
      return;
    }
    files.push(file);
  }

  private dedupeByPath(files: GeneratedFile[]): GeneratedFile[] {
    const seen = new Set<string>();
    const deduped: GeneratedFile[] = [];
    for (const file of files) {
      if (seen.has(file.path)) continue;
      seen.add(file.path);
      deduped.push(file);
    }
    return deduped;
  }

  private safeRelativePath(filePath: string): string {
    const normalized = path.posix.normalize(String(filePath).replaceAll("\\", "/").trim());
    if (!normalized || normalized.startsWith("../") || normalized === ".." || path.posix.isAbsolute(normalized)) {
      throw new BadRequestException("Generated file path escapes workspace");
    }

    const parts = normalized.split("/");
    const blocked = new Set(["node_modules", ".git", "dist", "build", ".next"]);
    if (parts.some((part) => part.startsWith(".env") || blocked.has(part))) {
      throw new BadRequestException(`Generated file path is not allowed: ${normalized}`);
    }

    return normalized;
  }

  private cleanName(name: string): string {
    return (
      name
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 64) || "Generated App"
    );
  }

  private cleanLabel(value: string): string {
    return value.replace(/\s+/g, " ").trim().slice(0, 140) || "Generated file";
  }

  private slug(name: string): string {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "generated-app"
    );
  }

  private languageFromPath(filePath: string): string {
    if (filePath.endsWith(".html")) return "html";
    if (filePath.endsWith(".css")) return "css";
    if (filePath.endsWith(".js")) return "javascript";
    if (filePath.endsWith(".ts")) return "typescript";
    if (filePath.endsWith(".json")) return "json";
    if (filePath.endsWith(".md")) return "markdown";
    if (filePath === "Dockerfile") return "dockerfile";
    return "text";
  }

  private previewFromPath(filePath: string): string {
    if (filePath === "preview/index.html") return "Runnable AI-generated preview";
    if (filePath === "package.json") return "CI quality scripts";
    if (filePath === "Dockerfile") return "Static preview container";
    if (filePath === "README.md") return "Generated app documentation";
    return "AI-generated source file";
  }
}
