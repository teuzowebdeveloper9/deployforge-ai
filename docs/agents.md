# Agents

DeployForge AI includes an agent-service, not a project skills system in this phase.

The agent-service:

- Receives a user prompt.
- Builds a base software architecture system prompt.
- Detects configured AI provider keys and calls the best available provider first.
- Falls back through Anthropic, Gemini, OpenAI, OpenRouter, DeepSeek and Mistral by default.
- Uses LangChain-style structured tools to select a project design base for common requests such as dashboards, to-do lists, CRM, inventory, bookings, expenses, kanban and customer portals.
- Returns a technical plan, analysis or generated app file payload.
- Never edits files directly.
- Never suggests committing secrets or weakening quality checks.

Future controlled tool execution should happen through API-owned tools or MCP-style orchestration, not direct filesystem writes from the agent-service.

See `docs/ai-provider-routing.md` for provider priority, environment variables, fallback behavior and diagnostics.
See `docs/agent-design-skill.md` for project bases and the designer-skill generation flow.
