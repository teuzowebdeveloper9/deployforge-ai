import { Injectable } from "@nestjs/common";
import { SnapshotFile } from "../../../storage/application/services/snapshot.service";

export interface GeneratedFile extends SnapshotFile {
  language: string;
  preview: string;
}

export interface GeneratedAppFiles {
  appName: string;
  files: GeneratedFile[];
  previewHtml: string;
}

@Injectable()
export class GeneratedAppFilesService {
  create(input: { prompt: string; requestedName?: string; plan: string }): GeneratedAppFiles {
    const appName = this.cleanName(input.requestedName || this.nameFromPrompt(input.prompt));
    const domain = this.domainFromPrompt(input.prompt);
    const features = this.featuresFromPrompt(input.prompt);
    const previewHtml = this.previewHtml({ appName, prompt: input.prompt, domain, features, plan: input.plan });
    const files: GeneratedFile[] = [
      {
        path: "package.json",
        language: "json",
        preview: "Node package with quality scripts",
        content: JSON.stringify(
          {
            name: this.slug(appName),
            version: "0.1.0",
            private: true,
            scripts: {
              lint: "node -e \"console.log('lint ok')\"",
              typecheck: "node -e \"console.log('typecheck ok')\"",
              test: "node -e \"console.log('test ok')\"",
              build: "node -e \"console.log('build ok')\""
            }
          },
          null,
          2
        )
      },
      {
        path: "README.md",
        language: "markdown",
        preview: "Generated product brief",
        content: `# ${appName}\n\nGenerated from this prompt:\n\n> ${input.prompt}\n\n## Planned capabilities\n\n${features
          .map((feature) => `- ${feature}`)
          .join("\n")}\n\n## Agent plan\n\n${input.plan.slice(0, 2000)}\n`
      },
      {
        path: "preview/index.html",
        language: "html",
        preview: "Static preview rendered by DeployForge",
        content: previewHtml
      },
      {
        path: "src/app.ts",
        language: "typescript",
        preview: "Generated app model",
        content: `export const app = ${JSON.stringify({ name: appName, domain, features }, null, 2)};\n`
      },
      {
        path: "Dockerfile",
        language: "dockerfile",
        preview: "Preview container definition for the next sandbox phase",
        content: "FROM nginx:alpine\nCOPY preview/index.html /usr/share/nginx/html/index.html\n"
      }
    ];

    return { appName, files, previewHtml };
  }

  private nameFromPrompt(prompt: string): string {
    const compact = prompt.replace(/\s+/g, " ").trim();
    const withoutCommand = compact.replace(/^(cria|crie|create|build|gere|gera)\s+(um|uma|an|a)?\s*/i, "");
    const firstWords = withoutCommand.split(" ").slice(0, 4).join(" ");
    return firstWords || "Generated App";
  }

  private cleanName(name: string): string {
    return name
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 48) || "Generated App";
  }

  private slug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "generated-app";
  }

  private domainFromPrompt(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes("crm")) return "Customer operations";
    if (lower.includes("ecommerce") || lower.includes("loja")) return "Commerce";
    if (lower.includes("dashboard")) return "Analytics";
    if (lower.includes("billing") || lower.includes("pagamento")) return "Billing";
    if (lower.includes("saas")) return "SaaS";
    return "Product workspace";
  }

  private featuresFromPrompt(prompt: string): string[] {
    const lower = prompt.toLowerCase();
    const features = new Set<string>();
    if (lower.includes("login")) features.add("Authentication-ready entry flow");
    if (lower.includes("dashboard")) features.add("Operational dashboard");
    if (lower.includes("cliente") || lower.includes("customer") || lower.includes("crm")) features.add("Customer records");
    if (lower.includes("billing") || lower.includes("pagamento")) features.add("Billing status tracking");
    if (lower.includes("kanban")) features.add("Kanban workflow");
    if (lower.includes("relat") || lower.includes("analytics")) features.add("Analytics overview");
    features.add("Responsive preview UI");
    features.add("Quality-gate scripts");
    return [...features].slice(0, 6);
  }

  private previewHtml(input: {
    appName: string;
    prompt: string;
    domain: string;
    features: string[];
    plan: string;
  }): string {
    const featureCards = input.features
      .map(
        (feature, index) => `
          <article class="feature">
            <span>0${index + 1}</span>
            <strong>${this.escape(feature)}</strong>
            <p>${this.escape(this.featureDescription(feature))}</p>
          </article>`
      )
      .join("");

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${this.escape(input.appName)}</title>
    <style>
      :root { color-scheme: light; --ink: #111827; --muted: #64748b; --line: #dbe3ed; --panel: #f5f7fb; --accent: #0f766e; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f2f5f8; color: var(--ink); }
      .shell { min-height: 100vh; padding: 32px; }
      .frame { max-width: 1180px; margin: 0 auto; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; background: white; box-shadow: 0 18px 60px rgba(15, 23, 42, 0.08); }
      header { display: flex; justify-content: space-between; gap: 20px; align-items: center; padding: 18px 22px; border-bottom: 1px solid var(--line); }
      .brand { display: flex; align-items: center; gap: 12px; font-weight: 750; }
      .logo { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 10px; color: white; background: var(--ink); }
      .badge { border: 1px solid var(--line); color: var(--muted); border-radius: 999px; padding: 7px 12px; font-size: 13px; }
      main { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 0; min-height: 640px; }
      .hero { padding: 54px 48px; border-right: 1px solid var(--line); }
      .eyebrow { color: var(--accent); font-size: 13px; font-weight: 750; text-transform: uppercase; }
      h1 { margin: 12px 0 16px; font-size: clamp(34px, 5vw, 58px); line-height: 1.02; letter-spacing: 0; }
      .lead { color: var(--muted); font-size: 18px; line-height: 1.65; max-width: 680px; }
      .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
      button { border: 0; border-radius: 10px; padding: 12px 16px; font-weight: 750; }
      .primary { background: var(--accent); color: white; }
      .secondary { background: var(--panel); color: var(--ink); border: 1px solid var(--line); }
      .side { padding: 28px; background: var(--panel); }
      .metric-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px; }
      .metric, .feature { background: white; border: 1px solid var(--line); border-radius: 12px; padding: 16px; }
      .metric span, .feature span { color: var(--muted); font-size: 12px; font-weight: 750; text-transform: uppercase; }
      .metric strong { display: block; font-size: 24px; margin-top: 8px; }
      .features { display: grid; gap: 12px; }
      .feature strong { display: block; margin-top: 8px; font-size: 15px; }
      .feature p { color: var(--muted); line-height: 1.5; margin: 8px 0 0; font-size: 14px; }
      .prompt { margin-top: 28px; border: 1px solid var(--line); background: var(--panel); border-radius: 12px; padding: 14px; color: var(--muted); line-height: 1.55; }
      @media (max-width: 860px) { .shell { padding: 16px; } main { grid-template-columns: 1fr; } .hero { border-right: 0; border-bottom: 1px solid var(--line); padding: 32px 22px; } }
    </style>
  </head>
  <body>
    <div class="shell">
      <div class="frame">
        <header>
          <div class="brand"><div class="logo">${this.escape(input.appName.slice(0, 2).toUpperCase())}</div>${this.escape(input.appName)}</div>
          <div class="badge">${this.escape(input.domain)}</div>
        </header>
        <main>
          <section class="hero">
            <div class="eyebrow">Generated by DeployForge AI</div>
            <h1>${this.escape(input.appName)}</h1>
            <p class="lead">${this.escape(this.valueProp(input.domain))}</p>
            <div class="actions">
              <button class="primary">Start workflow</button>
              <button class="secondary">View records</button>
            </div>
            <div class="prompt">${this.escape(input.prompt)}</div>
          </section>
          <aside class="side">
            <div class="metric-grid">
              <div class="metric"><span>Quality</span><strong>Ready</strong></div>
              <div class="metric"><span>Preview</span><strong>Live</strong></div>
            </div>
            <div class="features">${featureCards}</div>
          </aside>
        </main>
      </div>
    </div>
  </body>
</html>`;
  }

  private valueProp(domain: string): string {
    const props: Record<string, string> = {
      "Customer operations": "A focused workspace for tracking relationships, pipeline activity and customer context.",
      Commerce: "A storefront-ready product surface with operational controls and conversion-focused structure.",
      Analytics: "A clear operational dashboard for scanning metrics, status and decisions.",
      Billing: "A billing control surface for tracking accounts, payment state and revenue operations.",
      SaaS: "A clean SaaS workspace with repeatable flows and production-minded structure."
    };
    return props[domain] ?? "A generated application preview with a clean product structure and quality-gate-ready files.";
  }

  private featureDescription(feature: string): string {
    if (feature.includes("Authentication")) return "Prepared as a protected entry point without storing secrets in the app.";
    if (feature.includes("dashboard")) return "Designed for quick status scanning and repeated operational use.";
    if (feature.includes("Customer")) return "Keeps account data and workflow state visible in one place.";
    if (feature.includes("Billing")) return "Models payment status and billing operations without leaking secret values.";
    if (feature.includes("Kanban")) return "Organizes work into clear stages for faster triage.";
    if (feature.includes("Analytics")) return "Highlights useful summaries before deep detail.";
    return "Generated as part of the MVP app scaffold.";
  }

  private escape(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}
