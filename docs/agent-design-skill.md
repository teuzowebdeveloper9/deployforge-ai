# Agent Design Skill

DeployForge AI now includes a LangChain-style project design skill inside the agent-service. It exposes structured tools that detect common app requests and select an original reusable base before asking the AI provider to generate files.

This is not a generic skills marketplace. It is a bounded generation helper for common product types that users repeatedly request.

## Why This Exists

Many prompts ask for the same project shapes:

- dashboard or admin panel
- to-do list or task tracker
- CRM or sales pipeline
- inventory manager
- booking or scheduling app
- expense tracker
- project board or kanban
- customer portal or helpdesk

The skill gives the agent a concrete product decomposition instead of letting it return a generic plan or a blank-looking app.

## How It Works

1. `ProjectDesignSkill` normalizes the prompt.
2. The LangChain-style `select_project_base` tool scores prompt keywords against known project bases.
3. The selected tool result is injected into the generation prompt.
4. The provider adapts the base to the user's request.
5. If all providers fail, the LangChain-style `unpack_project_base` tool expands the selected base into real files locally.

Main files:

```txt
apps/agent-service/app/skills/project_design_skill.py
apps/agent-service/app/services/agent_service.py
```

The skill exposes two structured tools:

| Tool | Purpose |
| --- | --- |
| `select_project_base` | Selects the best project base from the user prompt. |
| `unpack_project_base` | Expands the selected base into generated files when a deterministic fallback is needed. |

When `langchain-core` is installed, these are real `StructuredTool` instances. During local tests before dependencies are installed, the service uses a compatible fallback object with the same `name`, `description` and `invoke()` behavior.

The fallback output includes:

```txt
package.json
preview/index.html
src/app.js
README.md
Dockerfile
```

## Current Bases

| Base | Trigger examples | Included product shape |
| --- | --- | --- |
| `operations-dashboard` | dashboard, painel, admin, KPI, analytics | KPI cards, alerts, records, workflow |
| `task-list` | todo, to-do, task, tarefas, checklist | task list, priorities, filters, local persistence |
| `crm-pipeline` | CRM, leads, vendas, pipeline, clientes | pipeline records, deal values, next actions |
| `inventory-manager` | inventory, estoque, produtos, stock | stock levels, reorder states, suppliers |
| `booking-scheduler` | booking, reservas, agenda, calendario | bookings, availability, clients, rooms |
| `expense-tracker` | expenses, despesas, financeiro, budget | spend metrics, approvals, receipts |
| `project-kanban` | project, projeto, kanban, sprint, roadmap | project work, blockers, milestones |
| `customer-portal` | portal, support, helpdesk, tickets, pedido | requests, orders, support status |

## Design Rules

- Build the actual usable app as the first screen.
- Avoid generic landing pages when the user asks for an app/tool.
- Use dense but clean operational UI for dashboards, CRM, admin, inventory and finance.
- Include realistic records, filters, actions and empty states.
- Keep generated preview self-contained in `preview/index.html`.
- Use `localStorage` for small interactive state.
- Do not include secrets, external tracking, private APIs or real credentials.
- Do not copy proprietary template code from external UI kits.

## Research Notes

The selected bases mirror common app-template categories seen in no-code galleries, dashboard kits and admin template ecosystems:

- dashboards/admin panels commonly include overview widgets, tables, activity feeds, billing/settings/team views and operational pages
- no-code galleries commonly surface customer portals, project management, inventory, operations, sales dashboards and event or booking apps
- dashboard component libraries commonly include analytics, CRM, e-commerce, marketing, settings, file manager, pricing and team views

Use external template research to identify patterns only. Generated code should be original DeployForge code unless a future template source is explicitly added with compatible redistribution rights.
