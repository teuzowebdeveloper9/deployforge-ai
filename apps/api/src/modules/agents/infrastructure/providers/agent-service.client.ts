import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { loadConfig } from "../../../../shared/config/app.config";
import { redactSecrets } from "../../../../shared/logger/safe-log";
import { AuthenticatedUser } from "../../../auth/application/ports/auth-provider.port";

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
  private readonly config = loadConfig();
  private readonly baseUrl = this.config.agentServiceUrl;

  async plan(message: string, user?: AuthenticatedUser): Promise<AgentPlanResponse> {
    const response = await fetch(`${this.baseUrl}/agent/plan`, {
      method: "POST",
      headers: this.headers(user),
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

  async generateApp(prompt: string, user?: AuthenticatedUser): Promise<AgentGeneratedAppResponse> {
    const response = await fetch(`${this.baseUrl}/agent/generate-app`, {
      method: "POST",
      headers: this.headers(user),
      body: JSON.stringify({ prompt }),
      signal: AbortSignal.timeout(180_000)
    });

    if (!response.ok) {
      const text = redactSecrets(await response.text());
      throw new ServiceUnavailableException(`agent-service generation failed: ${response.status} ${text}`);
    }

    return (await response.json()) as AgentGeneratedAppResponse;
  }

  private headers(user?: AuthenticatedUser): Record<string, string> {
    return {
      "Content-Type": "application/json",
      ...(this.config.gatewayServiceToken ? { "X-Gateway-Token": this.config.gatewayServiceToken } : {}),
      ...(user?.id ? { "X-User-Id": user.id } : {}),
      ...(user?.email ? { "X-User-Email": user.email } : {}),
      ...(user?.name ? { "X-User-Name": user.name } : {}),
      ...(user?.orgId ? { "X-Org-Id": user.orgId } : {}),
      ...(user?.role ? { "X-Role": user.role } : {}),
      ...(user?.plan ? { "X-Plan": user.plan } : {}),
      ...(user?.sessionId ? { "X-Session-Id": user.sessionId } : {})
    };
  }
}
