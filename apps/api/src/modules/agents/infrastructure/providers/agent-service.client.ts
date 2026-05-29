import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { loadConfig } from "../../../../shared/config/app.config";
import { redactSecrets } from "../../../../shared/logger/safe-log";

export interface AgentPlanResponse {
  mode: string;
  response: string;
  provider: string;
  model: string;
}

export interface AgentGeneratedFile {
  path: string;
  content: string;
  language: string;
  purpose: string;
}

export interface AgentGeneratedAppResponse {
  mode: string;
  provider: string;
  model: string;
  app_name: string;
  description: string;
  notes: string;
  files: AgentGeneratedFile[];
}

@Injectable()
export class AgentServiceClient {
  private readonly baseUrl = loadConfig().agentServiceUrl;

  async plan(message: string): Promise<AgentPlanResponse> {
    const response = await fetch(`${this.baseUrl}/agent/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: message }),
      signal: AbortSignal.timeout(120_000)
    });

    if (!response.ok) {
      const text = redactSecrets(await response.text());
      return {
        mode: "fallback",
        response: `agent-service unavailable: ${response.status} ${text}`,
        provider: "api-fallback",
        model: "none"
      };
    }

    return (await response.json()) as AgentPlanResponse;
  }

  async generateApp(prompt: string): Promise<AgentGeneratedAppResponse> {
    const response = await fetch(`${this.baseUrl}/agent/generate-app`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
      signal: AbortSignal.timeout(180_000)
    });

    if (!response.ok) {
      const text = redactSecrets(await response.text());
      throw new ServiceUnavailableException(`agent-service generation failed: ${response.status} ${text}`);
    }

    return (await response.json()) as AgentGeneratedAppResponse;
  }
}
