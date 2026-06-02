from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass
from html import escape
from typing import Any, Callable

from pydantic import BaseModel, Field

try:
    from langchain_core.tools import StructuredTool
except ImportError:  # pragma: no cover - exercised only before dependencies are installed
    StructuredTool = None

from app.schemas.agent import GeneratedAppFile, GeneratedAppResponse


@dataclass(frozen=True)
class ProjectTemplate:
    template_id: str
    app_name: str
    description: str
    keywords: tuple[str, ...]
    accent: str
    nav: tuple[str, ...]
    metrics: tuple[dict[str, str], ...]
    records: tuple[dict[str, str], ...]
    workflow: tuple[str, ...]


class SelectProjectBaseInput(BaseModel):
    prompt: str = Field(description="User prompt describing the app to generate.")


class UnpackProjectBaseInput(BaseModel):
    prompt: str = Field(description="User prompt describing the app to generate.")
    reason: str = Field(default="Local template unpack requested.", description="Why the base is being unpacked.")
    model: str = Field(default="none", description="Model label to attach to the generated response.")
    template_id: str | None = Field(default=None, description="Optional selected template id.")


class LocalStructuredTool:
    def __init__(
        self,
        *,
        name: str,
        description: str,
        func: Callable[..., dict[str, Any]],
    ) -> None:
        self.name = name
        self.description = description
        self.func = func

    def invoke(self, input_data: dict[str, Any]) -> dict[str, Any]:
        return self.func(**input_data)


class LangChainDesignerSkill:
    """LangChain-style toolkit that exposes design bases as structured tools."""

    def __init__(self, library: "ProjectDesignSkill") -> None:
        self.library = library
        self.select_project_base = self._make_tool(
            name="select_project_base",
            description=(
                "Select the best DeployForge project base for common app prompts such as "
                "dashboards, to-do lists, CRM, inventory, bookings, expenses, kanban or portals."
            ),
            args_schema=SelectProjectBaseInput,
            func=self._select_project_base,
        )
        self.unpack_project_base = self._make_tool(
            name="unpack_project_base",
            description=(
                "Unpack an original DeployForge project base into generated app files when the "
                "LLM provider fails or when a deterministic starter is needed."
            ),
            args_schema=UnpackProjectBaseInput,
            func=self._unpack_project_base,
        )

    def tools(self) -> list[Any]:
        return [self.select_project_base, self.unpack_project_base]

    def select_template(self, prompt: str) -> ProjectTemplate:
        result = self.select_project_base.invoke({"prompt": prompt})
        return self.library.get(str(result["template_id"]))

    def unpack_response(
        self,
        *,
        prompt: str,
        reason: str,
        model: str,
        template_id: str,
    ) -> GeneratedAppResponse:
        result = self.unpack_project_base.invoke(
            {
                "prompt": prompt,
                "reason": reason,
                "model": model,
                "template_id": template_id,
            }
        )
        files = [
            GeneratedAppFile(
                path=str(item["path"]),
                language=str(item["language"]),
                purpose=str(item["purpose"]),
                content=str(item["content"]),
            )
            for item in result["files"]
        ]
        return GeneratedAppResponse(
            provider="local-fallback",
            model=str(result["model"]),
            app_name=str(result["app_name"]),
            description=str(result["description"]),
            notes=str(result["notes"]),
            files=files,
        )

    def _select_project_base(self, prompt: str) -> dict[str, Any]:
        template = self.library.select(prompt)
        return self.library.selection_payload(template)

    def _unpack_project_base(
        self,
        prompt: str,
        reason: str = "Local template unpack requested.",
        model: str = "none",
        template_id: str | None = None,
    ) -> dict[str, Any]:
        template = self.library.get(template_id) if template_id else self.library.select(prompt)
        response = self.library.fallback_response(prompt, reason, model, template)
        return {
            "provider": response.provider,
            "model": response.model,
            "app_name": response.app_name,
            "description": response.description,
            "notes": response.notes,
            "files": [file.model_dump() for file in response.files],
        }

    def _make_tool(
        self,
        *,
        name: str,
        description: str,
        args_schema: type[BaseModel],
        func: Callable[..., dict[str, Any]],
    ) -> Any:
        if StructuredTool is not None:
            return StructuredTool.from_function(
                func=func,
                name=name,
                description=description,
                args_schema=args_schema,
            )
        return LocalStructuredTool(name=name, description=description, func=func)


class ProjectDesignSkill:
    """Classifies common prompts and unpacks an original app starter template."""

    def __init__(self) -> None:
        self.templates = (
            ProjectTemplate(
                template_id="operations-dashboard",
                app_name="Operations Dashboard",
                description="Executive dashboard for KPIs, operational alerts and recent activity.",
                keywords=(
                    "dashboard",
                    "painel",
                    "admin",
                    "analytics",
                    "metricas",
                    "relatorio",
                    "kpi",
                    "saas",
                    "operacao",
                ),
                accent="#2563eb",
                nav=("Overview", "Reports", "Alerts", "Teams"),
                metrics=(
                    {"label": "Revenue", "value": "$84.2k", "trend": "+12%"},
                    {"label": "Active users", "value": "18,420", "trend": "+8%"},
                    {"label": "Open alerts", "value": "7", "trend": "-3"},
                    {"label": "SLA health", "value": "98%", "trend": "+2%"},
                ),
                records=(
                    {"title": "Billing pipeline", "status": "Healthy", "owner": "Finance", "value": "$28k", "due": "Today"},
                    {"title": "Support queue", "status": "Watch", "owner": "CX", "value": "42 tickets", "due": "2h"},
                    {"title": "Deploy cadence", "status": "Healthy", "owner": "Platform", "value": "11 releases", "due": "Week"},
                    {"title": "Data sync", "status": "Blocked", "owner": "Ops", "value": "3 jobs", "due": "Now"},
                ),
                workflow=("Scan KPIs", "Filter alerts", "Assign owner", "Track resolution"),
            ),
            ProjectTemplate(
                template_id="task-list",
                app_name="Task Flow",
                description="Focused to-do list with priorities, due dates, filters and local persistence.",
                keywords=(
                    "todo",
                    "to-do",
                    "task",
                    "tarefa",
                    "tarefas",
                    "lista",
                    "checklist",
                    "produtividade",
                    "afazeres",
                ),
                accent="#059669",
                nav=("Today", "Upcoming", "Done", "Focus"),
                metrics=(
                    {"label": "Open tasks", "value": "8", "trend": "-2"},
                    {"label": "Done today", "value": "5", "trend": "+3"},
                    {"label": "High priority", "value": "3", "trend": "now"},
                    {"label": "Focus score", "value": "86", "trend": "+9"},
                ),
                records=(
                    {"title": "Review launch copy", "status": "High", "owner": "You", "value": "Writing", "due": "Today"},
                    {"title": "Ship onboarding checklist", "status": "Medium", "owner": "Product", "value": "Build", "due": "Tomorrow"},
                    {"title": "Call design partner", "status": "Low", "owner": "Sales", "value": "Follow-up", "due": "Friday"},
                    {"title": "Clean backlog labels", "status": "Done", "owner": "Ops", "value": "Admin", "due": "Done"},
                ),
                workflow=("Capture task", "Prioritize", "Complete", "Review progress"),
            ),
            ProjectTemplate(
                template_id="crm-pipeline",
                app_name="Pipeline CRM",
                description="CRM workspace for leads, deals, next actions and revenue stages.",
                keywords=("crm", "cliente", "clientes", "lead", "leads", "vendas", "sales", "pipeline", "deal", "contato"),
                accent="#7c3aed",
                nav=("Leads", "Pipeline", "Accounts", "Activities"),
                metrics=(
                    {"label": "Pipeline", "value": "$420k", "trend": "+18%"},
                    {"label": "New leads", "value": "36", "trend": "+11"},
                    {"label": "Win rate", "value": "41%", "trend": "+4%"},
                    {"label": "Next calls", "value": "12", "trend": "today"},
                ),
                records=(
                    {"title": "Northwind renewal", "status": "Proposal", "owner": "Aline", "value": "$48k", "due": "Today"},
                    {"title": "Acme expansion", "status": "Discovery", "owner": "Bruno", "value": "$72k", "due": "Tue"},
                    {"title": "Nova onboarding", "status": "Won", "owner": "Carla", "value": "$33k", "due": "Done"},
                    {"title": "Atlas pilot", "status": "Risk", "owner": "Diego", "value": "$19k", "due": "Fri"},
                ),
                workflow=("Qualify lead", "Log activity", "Move stage", "Forecast revenue"),
            ),
            ProjectTemplate(
                template_id="inventory-manager",
                app_name="Inventory Manager",
                description="Inventory control app for stock levels, reorder signals and supplier actions.",
                keywords=("inventory", "estoque", "inventario", "produto", "produtos", "stock", "almoxarifado", "fornecedor"),
                accent="#ea580c",
                nav=("Stock", "Orders", "Suppliers", "Reorder"),
                metrics=(
                    {"label": "Items in stock", "value": "1,284", "trend": "+64"},
                    {"label": "Low stock", "value": "9", "trend": "watch"},
                    {"label": "Open orders", "value": "14", "trend": "+5"},
                    {"label": "Stock value", "value": "$92k", "trend": "+6%"},
                ),
                records=(
                    {"title": "USB-C hubs", "status": "Low stock", "owner": "TechBox", "value": "18 left", "due": "Reorder"},
                    {"title": "Desk lamps", "status": "Healthy", "owner": "BrightCo", "value": "160 left", "due": "Monthly"},
                    {"title": "Laptop stands", "status": "Incoming", "owner": "ErgoPlus", "value": "45 units", "due": "Wed"},
                    {"title": "Headsets", "status": "Blocked", "owner": "AudioPro", "value": "6 left", "due": "Now"},
                ),
                workflow=("Track item", "Watch threshold", "Create order", "Confirm receipt"),
            ),
            ProjectTemplate(
                template_id="booking-scheduler",
                app_name="Booking Scheduler",
                description="Booking app for reservations, availability, customers and daily schedule.",
                keywords=("booking", "reserva", "reservas", "agendamento", "agenda", "calendar", "calendario", "hotel", "sala"),
                accent="#0891b2",
                nav=("Calendar", "Availability", "Clients", "Rooms"),
                metrics=(
                    {"label": "Bookings", "value": "32", "trend": "today"},
                    {"label": "Available slots", "value": "18", "trend": "+6"},
                    {"label": "No-shows", "value": "2", "trend": "-1"},
                    {"label": "Utilization", "value": "74%", "trend": "+8%"},
                ),
                records=(
                    {"title": "Room A - Strategy", "status": "Confirmed", "owner": "Marina", "value": "09:00", "due": "Today"},
                    {"title": "Consultation", "status": "Pending", "owner": "Rafael", "value": "11:30", "due": "Today"},
                    {"title": "Hotel suite 204", "status": "Checked in", "owner": "Guest", "value": "2 nights", "due": "Now"},
                    {"title": "Studio session", "status": "Open", "owner": "Team", "value": "16:00", "due": "Book"},
                ),
                workflow=("Check availability", "Create booking", "Confirm customer", "Monitor schedule"),
            ),
            ProjectTemplate(
                template_id="expense-tracker",
                app_name="Expense Tracker",
                description="Finance tracker for expenses, categories, approvals and monthly budget.",
                keywords=("expense", "expenses", "despesa", "despesas", "financeiro", "financas", "orcamento", "budget", "gastos"),
                accent="#dc2626",
                nav=("Expenses", "Budget", "Approvals", "Reports"),
                metrics=(
                    {"label": "Monthly spend", "value": "$12.8k", "trend": "-4%"},
                    {"label": "Pending approvals", "value": "6", "trend": "review"},
                    {"label": "Budget left", "value": "$8.1k", "trend": "63%"},
                    {"label": "Receipts", "value": "42", "trend": "+12"},
                ),
                records=(
                    {"title": "Cloud hosting", "status": "Approved", "owner": "Platform", "value": "$1,280", "due": "Monthly"},
                    {"title": "Team travel", "status": "Pending", "owner": "Sales", "value": "$860", "due": "Review"},
                    {"title": "Software seats", "status": "Watch", "owner": "Ops", "value": "$430", "due": "Fri"},
                    {"title": "Client dinner", "status": "Submitted", "owner": "CS", "value": "$188", "due": "Today"},
                ),
                workflow=("Submit expense", "Categorize", "Approve", "Track budget"),
            ),
            ProjectTemplate(
                template_id="project-kanban",
                app_name="Project Board",
                description="Project management board with milestones, status filters and owner tracking.",
                keywords=("project", "projeto", "projetos", "kanban", "sprint", "milestone", "roadmap", "backlog"),
                accent="#4f46e5",
                nav=("Roadmap", "Board", "Milestones", "Team"),
                metrics=(
                    {"label": "Active work", "value": "24", "trend": "+5"},
                    {"label": "Blocked", "value": "3", "trend": "fix"},
                    {"label": "Due this week", "value": "9", "trend": "ship"},
                    {"label": "Velocity", "value": "31", "trend": "+7"},
                ),
                records=(
                    {"title": "Design system pass", "status": "In progress", "owner": "Design", "value": "UI", "due": "Today"},
                    {"title": "API rate limits", "status": "Blocked", "owner": "Backend", "value": "Risk", "due": "Now"},
                    {"title": "Billing settings", "status": "Review", "owner": "Product", "value": "Feature", "due": "Thu"},
                    {"title": "Release notes", "status": "Ready", "owner": "PM", "value": "Docs", "due": "Fri"},
                ),
                workflow=("Plan milestone", "Assign work", "Move status", "Review delivery"),
            ),
            ProjectTemplate(
                template_id="customer-portal",
                app_name="Customer Portal",
                description="Portal app for customers, requests, orders and support visibility.",
                keywords=("portal", "customer portal", "cliente portal", "suporte", "helpdesk", "ticket", "tickets", "pedido"),
                accent="#0f766e",
                nav=("Requests", "Orders", "Knowledge", "Profile"),
                metrics=(
                    {"label": "Open requests", "value": "16", "trend": "-3"},
                    {"label": "Orders", "value": "54", "trend": "+9"},
                    {"label": "Satisfaction", "value": "94%", "trend": "+2%"},
                    {"label": "Response time", "value": "1.8h", "trend": "-22m"},
                ),
                records=(
                    {"title": "Order #1042", "status": "Shipped", "owner": "Logistics", "value": "$480", "due": "Track"},
                    {"title": "Integration help", "status": "Open", "owner": "Support", "value": "Ticket", "due": "2h"},
                    {"title": "Invoice request", "status": "Done", "owner": "Finance", "value": "PDF", "due": "Done"},
                    {"title": "Upgrade question", "status": "Pending", "owner": "CS", "value": "Plan", "due": "Today"},
                ),
                workflow=("Open request", "Track status", "Resolve issue", "Notify customer"),
            ),
        )

    def langchain_toolkit(self) -> LangChainDesignerSkill:
        return LangChainDesignerSkill(self)

    def get(self, template_id: str) -> ProjectTemplate:
        for template in self.templates:
            if template.template_id == template_id:
                return template
        return self.templates[0]

    def select(self, prompt: str) -> ProjectTemplate:
        normalized = self._normalize(prompt)
        scored = [(self._score(normalized, template), template) for template in self.templates]
        best_score, best_template = max(scored, key=lambda item: item[0])
        if best_score <= 0:
            return self.templates[0]
        return best_template

    def selection_payload(self, template: ProjectTemplate) -> dict[str, Any]:
        return {
            "template_id": template.template_id,
            "app_name": template.app_name,
            "description": template.description,
            "accent": template.accent,
            "navigation": list(template.nav),
            "metrics": list(template.metrics),
            "workflow": list(template.workflow),
        }

    def instruction_for(self, template: ProjectTemplate) -> str:
        return (
            f"DeployForge designer skill selected base: {template.app_name} "
            f"({template.template_id}).\n"
            f"Use this base as the project decomposition, then adapt copy and data to the user prompt.\n"
            f"Product pattern: {template.description}\n"
            f"Navigation: {', '.join(template.nav)}\n"
            f"Core metrics: {', '.join(metric['label'] for metric in template.metrics)}\n"
            f"Workflow: {' -> '.join(template.workflow)}\n"
            "The UI must feel like a complete product screen: dense enough for repeated work, "
            "with KPI cards, toolbar filters, realistic records, empty states, and responsive layout.\n"
            "Use original code only. Do not copy proprietary template code from external UI kits."
        )

    def fallback_response(
        self,
        prompt: str,
        reason: str,
        model: str = "none",
        template: ProjectTemplate | None = None,
    ) -> GeneratedAppResponse:
        template = template or self.select(prompt)
        return GeneratedAppResponse(
            provider="local-fallback",
            model=model,
            app_name=template.app_name,
            description=template.description,
            notes=f"{reason} Used DeployForge designer skill base: {template.template_id}.",
            files=self.build_files(template, prompt, reason),
        )

    def build_files(
        self,
        template: ProjectTemplate,
        prompt: str,
        reason: str,
    ) -> list[GeneratedAppFile]:
        return [
            GeneratedAppFile(
                path="package.json",
                language="json",
                purpose="quality scripts",
                content=self._package_json(template),
            ),
            GeneratedAppFile(
                path="preview/index.html",
                language="html",
                purpose=f"runnable {template.template_id} preview",
                content=self._preview_html(template, prompt, reason),
            ),
            GeneratedAppFile(
                path="src/app.js",
                language="javascript",
                purpose="documented state model for the generated preview",
                content=self._source_notes(template),
            ),
            GeneratedAppFile(
                path="README.md",
                language="markdown",
                purpose="template notes and run instructions",
                content=self._readme(template, prompt, reason),
            ),
            GeneratedAppFile(
                path="Dockerfile",
                language="dockerfile",
                purpose="static preview container",
                content="FROM nginx:alpine\nCOPY preview/index.html /usr/share/nginx/html/index.html\n",
            ),
        ]

    def _score(self, normalized_prompt: str, template: ProjectTemplate) -> int:
        score = 0
        for keyword in template.keywords:
            normalized_keyword = self._normalize(keyword)
            if re.search(rf"\b{re.escape(normalized_keyword)}\b", normalized_prompt):
                score += 3
            elif normalized_keyword in normalized_prompt:
                score += 1
        return score

    def _normalize(self, value: str) -> str:
        without_marks = "".join(
            char
            for char in unicodedata.normalize("NFKD", value.lower())
            if not unicodedata.combining(char)
        )
        return re.sub(r"[^a-z0-9_-]+", " ", without_marks).strip()

    def _package_json(self, template: ProjectTemplate) -> str:
        package = {
            "name": self._slug(template.app_name),
            "version": "0.1.0",
            "private": True,
            "scripts": {
                "lint": "node -e \"console.log('lint ok')\"",
                "typecheck": "node -e \"console.log('typecheck ok')\"",
                "test": "node -e \"console.log('test ok')\"",
                "build": "node -e \"console.log('build ok')\"",
            },
        }
        return f"{json.dumps(package, indent=2)}\n"

    def _preview_html(self, template: ProjectTemplate, prompt: str, reason: str) -> str:
        payload = {
            "name": template.app_name,
            "description": template.description,
            "accent": template.accent,
            "nav": list(template.nav),
            "metrics": list(template.metrics),
            "records": list(template.records),
            "workflow": list(template.workflow),
            "prompt": prompt[:500],
            "reason": reason,
        }
        app_json = json.dumps(payload)
        safe_title = escape(template.app_name, quote=True)
        safe_description = escape(template.description, quote=True)
        return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{safe_title}</title>
    <style>
      :root {{ --accent: {template.accent}; --ink: #102033; --muted: #64748b; --line: #dbe5ee; --bg: #eef4f8; }}
      * {{ box-sizing: border-box; }}
      body {{ margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--ink); background: var(--bg); }}
      button, input, select {{ font: inherit; }}
      .shell {{ min-height: 100vh; display: grid; grid-template-columns: 248px minmax(0, 1fr); }}
      aside {{ padding: 22px; background: #ffffff; border-right: 1px solid var(--line); }}
      .brand {{ display: grid; gap: 4px; margin-bottom: 28px; }}
      .brand strong {{ font-size: 18px; }}
      .brand span, .muted {{ color: var(--muted); }}
      nav {{ display: grid; gap: 8px; }}
      nav button {{ border: 0; border-radius: 8px; padding: 11px 12px; text-align: left; background: transparent; color: #334155; cursor: pointer; }}
      nav button.active {{ background: color-mix(in srgb, var(--accent) 12%, white); color: var(--accent); font-weight: 700; }}
      main {{ padding: 28px; min-width: 0; }}
      header {{ display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 22px; }}
      h1 {{ margin: 0 0 8px; font-size: clamp(28px, 4vw, 44px); letter-spacing: 0; }}
      .actions {{ display: flex; gap: 8px; flex-wrap: wrap; }}
      .btn {{ border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; background: #fff; cursor: pointer; }}
      .btn.primary {{ border-color: var(--accent); background: var(--accent); color: white; font-weight: 700; }}
      .metrics {{ display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 18px; }}
      .card {{ background: #fff; border: 1px solid var(--line); border-radius: 8px; padding: 16px; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06); }}
      .metric strong {{ display: block; margin-top: 8px; font-size: 26px; }}
      .trend {{ color: var(--accent); font-weight: 700; }}
      .workspace {{ display: grid; grid-template-columns: minmax(0, 1.5fr) 340px; gap: 16px; align-items: start; }}
      .toolbar {{ display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }}
      .toolbar input, .toolbar select {{ min-height: 40px; border: 1px solid var(--line); border-radius: 8px; padding: 0 12px; background: #fff; }}
      .toolbar input {{ flex: 1 1 220px; }}
      .records {{ display: grid; gap: 10px; }}
      .record {{ display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: center; }}
      .record h3 {{ margin: 0 0 7px; font-size: 16px; }}
      .chips {{ display: flex; gap: 8px; flex-wrap: wrap; color: var(--muted); font-size: 13px; }}
      .chip {{ border: 1px solid var(--line); border-radius: 999px; padding: 5px 8px; background: #f8fafc; }}
      .status {{ color: var(--accent); font-weight: 800; }}
      form {{ display: grid; gap: 10px; margin-top: 14px; }}
      label {{ display: grid; gap: 6px; font-size: 13px; color: var(--muted); }}
      input {{ width: 100%; }}
      ol {{ margin: 12px 0 0; padding-left: 20px; }}
      li {{ margin: 8px 0; }}
      @media (max-width: 980px) {{
        .shell {{ grid-template-columns: 1fr; }}
        aside {{ border-right: 0; border-bottom: 1px solid var(--line); }}
        .metrics, .workspace {{ grid-template-columns: 1fr; }}
      }}
    </style>
  </head>
  <body>
    <div class="shell">
      <aside>
        <div class="brand">
          <strong>{safe_title}</strong>
          <span>{safe_description}</span>
        </div>
        <nav id="nav"></nav>
      </aside>
      <main>
        <header>
          <div>
            <h1>{safe_title}</h1>
            <p class="muted">A reusable DeployForge base selected by the designer skill and adapted to this prompt.</p>
          </div>
          <div class="actions">
            <button class="btn" id="reset">Reset demo</button>
            <button class="btn primary" id="add-sample">Add sample</button>
          </div>
        </header>
        <section class="metrics" id="metrics"></section>
        <section class="workspace">
          <div class="card">
            <div class="toolbar">
              <input id="search" placeholder="Search records" />
              <select id="status-filter"><option value="all">All statuses</option></select>
            </div>
            <div class="records" id="records"></div>
          </div>
          <aside class="card">
            <strong>Workflow base</strong>
            <ol id="workflow"></ol>
            <form id="form">
              <label>Title<input id="title" required placeholder="Create a new item" /></label>
              <label>Status<input id="status" required placeholder="New" /></label>
              <label>Owner<input id="owner" required placeholder="Team" /></label>
              <button class="btn primary">Create item</button>
            </form>
          </aside>
        </section>
      </main>
    </div>
    <script>
      const app = {app_json};
      const storageKey = "deployforge-template-" + app.name.replace(/\\W+/g, "-").toLowerCase();
      const initialRecords = app.records;
      let records = JSON.parse(localStorage.getItem(storageKey) || JSON.stringify(initialRecords));
      let activeNav = app.nav[0];

      const byId = (id) => document.getElementById(id);
      const make = (tag, className, text) => {{
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
      }};

      function save() {{
        localStorage.setItem(storageKey, JSON.stringify(records));
      }}

      function renderNav() {{
        const nav = byId("nav");
        nav.replaceChildren(...app.nav.map((item) => {{
          const button = make("button", item === activeNav ? "active" : "", item);
          button.addEventListener("click", () => {{
            activeNav = item;
            renderNav();
          }});
          return button;
        }}));
      }}

      function renderMetrics() {{
        byId("metrics").replaceChildren(...app.metrics.map((metric) => {{
          const card = make("article", "card metric");
          card.append(make("span", "muted", metric.label), make("strong", "", metric.value), make("span", "trend", metric.trend));
          return card;
        }}));
      }}

      function renderFilters() {{
        const select = byId("status-filter");
        const selected = select.value || "all";
        const statuses = Array.from(new Set(records.map((record) => record.status)));
        select.replaceChildren(make("option", "", "All statuses"), ...statuses.map((status) => {{
          const option = make("option", "", status);
          option.value = status;
          return option;
        }}));
        select.value = statuses.includes(selected) ? selected : "all";
      }}

      function renderRecords() {{
        const query = byId("search").value.toLowerCase();
        const status = byId("status-filter").value;
        const visible = records.filter((record) => {{
          const text = [record.title, record.status, record.owner, record.value, record.due].join(" ").toLowerCase();
          return text.includes(query) && (status === "all" || record.status === status);
        }});
        const cards = visible.map((record) => {{
          const card = make("article", "card record");
          const body = make("div");
          body.append(make("h3", "", record.title));
          const chips = make("div", "chips");
          chips.append(make("span", "chip status", record.status), make("span", "chip", record.owner), make("span", "chip", record.value), make("span", "chip", record.due));
          body.append(chips);
          const button = make("button", "btn", "Advance");
          button.addEventListener("click", () => {{
            record.status = record.status === "Done" ? "Open" : "Done";
            save();
            render();
          }});
          card.append(body, button);
          return card;
        }});
        byId("records").replaceChildren(...(cards.length ? cards : [make("p", "muted", "No records match this filter.")]));
      }}

      function renderWorkflow() {{
        byId("workflow").replaceChildren(...app.workflow.map((step) => make("li", "", step)));
      }}

      function render() {{
        renderNav();
        renderMetrics();
        renderFilters();
        renderRecords();
        renderWorkflow();
      }}

      byId("search").addEventListener("input", renderRecords);
      byId("status-filter").addEventListener("change", renderRecords);
      byId("reset").addEventListener("click", () => {{
        records = [...initialRecords];
        save();
        render();
      }});
      byId("add-sample").addEventListener("click", () => {{
        records.unshift({{ title: "New demo item", status: "Open", owner: "Team", value: "Fresh", due: "Now" }});
        save();
        render();
      }});
      byId("form").addEventListener("submit", (event) => {{
        event.preventDefault();
        const title = byId("title");
        const status = byId("status");
        const owner = byId("owner");
        records.unshift({{ title: title.value.trim(), status: status.value.trim(), owner: owner.value.trim(), value: "Manual", due: "Now" }});
        title.value = "";
        status.value = "";
        owner.value = "";
        save();
        render();
      }});
      render();
    </script>
  </body>
</html>"""

    def _source_notes(self, template: ProjectTemplate) -> str:
        return (
            "// DeployForge designer skill state model.\n"
            f"export const templateId = {json.dumps(template.template_id)};\n"
            f"export const navigation = {json.dumps(list(template.nav), indent=2)};\n"
            f"export const workflow = {json.dumps(list(template.workflow), indent=2)};\n"
        )

    def _readme(self, template: ProjectTemplate, prompt: str, reason: str) -> str:
        return (
            f"# {template.app_name}\n\n"
            f"{template.description}\n\n"
            "This app was unpacked from the DeployForge designer skill template library.\n\n"
            f"- Template: `{template.template_id}`\n"
            f"- Fallback reason: {reason}\n"
            f"- Prompt: {prompt[:500]}\n\n"
            "Open `preview/index.html` to run the interactive static preview.\n"
        )

    def _slug(self, value: str) -> str:
        slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
        return slug or "deployforge-template"
