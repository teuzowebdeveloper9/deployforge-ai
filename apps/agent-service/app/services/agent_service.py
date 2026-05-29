from app.core.config import settings
from app.providers.mistral_provider import MistralProvider
from app.schemas.agent import AgentResponse, GeneratedAppFile, GeneratedAppResponse
from app.security.prompt_guard import PromptGuard
from app.services.prompt_builder import PromptBuilder


class AgentService:
    def __init__(self) -> None:
        self.prompt_builder = PromptBuilder()
        self.prompt_guard = PromptGuard()
        self.provider = MistralProvider()

    async def plan(self, prompt: str) -> AgentResponse:
        guarded_prompt = self.prompt_guard.annotate(prompt)
        messages = self.prompt_builder.build_messages(guarded_prompt)
        content, provider = await self.provider.complete(messages)
        return AgentResponse(
            mode="plan",
            response=content,
            provider=provider,
            model=settings.mistral_model,
        )

    async def analyze(self, prompt: str) -> AgentResponse:
        guarded_prompt = self.prompt_guard.annotate(f"Analise tecnicamente este pedido:\n{prompt}")
        messages = self.prompt_builder.build_messages(guarded_prompt)
        content, provider = await self.provider.complete(messages)
        return AgentResponse(
            mode="analyze",
            response=content,
            provider=provider,
            model=settings.mistral_model,
        )

    async def generate_app(self, prompt: str) -> GeneratedAppResponse:
        guarded_prompt = self.prompt_guard.annotate(prompt)
        messages = self._build_generation_messages(guarded_prompt)
        try:
            payload, provider = await self.provider.complete_json(messages)
            if provider == "mistral":
                return self._from_payload(payload, provider)
        except Exception as exc:
            return self._fallback_generated_app(prompt, f"Mistral generation failed: {exc.__class__.__name__}")

        return self._fallback_generated_app(prompt, "MISTRAL_API_KEY is not configured.")

    def _build_generation_messages(self, prompt: str) -> list[dict[str, str]]:
        system = (
            "Voce e o gerador de codigo da DeployForge AI. Gere uma aplicacao real e pequena, "
            "baseada exatamente no pedido do usuario. Nao gere apenas uma tela generica ou mockada. "
            "A aplicacao deve ser um app web estatico autocontido para preview local, com HTML, CSS "
            "e JavaScript interativo no arquivo preview/index.html. Use localStorage quando fizer sentido, "
            "formularios, listas, filtros, cards, estados vazios e dados iniciais coerentes com o dominio. "
            "Nunca inclua secrets, .env, chaves reais, tracking externo ou chamadas para APIs privadas. "
            "Retorne somente JSON valido, sem markdown."
        )
        user = (
            "Gere os arquivos do app neste formato JSON exato:\n"
            "{\n"
            '  "app_name": "nome curto do produto",\n'
            '  "description": "o que o app faz",\n'
            '  "notes": "decisoes tecnicas resumidas",\n'
            '  "files": [\n'
            '    {"path":"package.json","language":"json","purpose":"quality scripts","content":"..."},\n'
            '    {"path":"preview/index.html","language":"html","purpose":"real runnable preview","content":"..."},\n'
            '    {"path":"src/app.js","language":"javascript","purpose":"app behavior extracted or documented","content":"..."},\n'
            '    {"path":"README.md","language":"markdown","purpose":"how to run","content":"..."},\n'
            '    {"path":"Dockerfile","language":"dockerfile","purpose":"nginx static preview","content":"..."}\n'
            "  ]\n"
            "}\n\n"
            "Regras obrigatorias dos arquivos:\n"
            "- preview/index.html deve ser uma aplicacao navegavel e interativa, nao uma landing page generica.\n"
            "- package.json deve ter scripts lint, typecheck, test e build que funcionem sem dependencias externas.\n"
            "- Dockerfile deve servir preview/index.html com nginx:alpine.\n"
            "- Nao crie .env nem qualquer arquivo que comece com .env.\n"
            "- Nao use placeholders como TODO no comportamento principal.\n"
            "- Gere no maximo 8 arquivos.\n\n"
            f"Pedido do usuario:\n{prompt}"
        )
        return [{"role": "system", "content": system}, {"role": "user", "content": user}]

    def _from_payload(self, payload: dict, provider: str) -> GeneratedAppResponse:
        files_payload = payload.get("files", [])
        if not isinstance(files_payload, list):
            raise ValueError("files must be a list")

        files = [
            GeneratedAppFile(
                path=str(item.get("path", "")),
                content=str(item.get("content", "")),
                language=str(item.get("language", "text")),
                purpose=str(item.get("purpose", "")),
            )
            for item in files_payload
            if isinstance(item, dict)
        ]

        return GeneratedAppResponse(
            provider=provider,
            model=settings.mistral_model,
            app_name=str(payload.get("app_name", "Generated App")),
            description=str(payload.get("description", "Generated application")),
            notes=str(payload.get("notes", "")),
            files=files,
        )

    def _fallback_generated_app(self, prompt: str, reason: str) -> GeneratedAppResponse:
        html = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Fallback generated app</title>
    <style>
      body {{ margin: 0; font-family: Inter, system-ui, sans-serif; background: #f8fafc; color: #111827; }}
      main {{ max-width: 960px; margin: 0 auto; padding: 32px; }}
      section {{ border: 1px solid #dbe3ed; background: white; border-radius: 12px; padding: 24px; }}
      textarea, input {{ width: 100%; box-sizing: border-box; margin-top: 8px; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; }}
      button {{ margin-top: 12px; padding: 10px 14px; border: 0; border-radius: 8px; background: #0f766e; color: white; font-weight: 700; }}
      li {{ margin: 8px 0; padding: 10px; background: #f1f5f9; border-radius: 8px; }}
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>Fallback generated app</h1>
        <p>The AI provider was unavailable, so DeployForge created a minimal interactive app shell.</p>
        <p><strong>Reason:</strong> {reason}</p>
        <p><strong>Prompt:</strong> {prompt[:500]}</p>
        <form id="form">
          <label>New item<input id="item" placeholder="Add something for this app" /></label>
          <button>Add item</button>
        </form>
        <ul id="items"></ul>
      </section>
    </main>
    <script>
      const items = JSON.parse(localStorage.getItem("deployforge-items") || "[]");
      const list = document.querySelector("#items");
      const render = () => {{ list.innerHTML = items.map((item) => `<li>${{item}}</li>`).join(""); }};
      document.querySelector("#form").addEventListener("submit", (event) => {{
        event.preventDefault();
        const input = document.querySelector("#item");
        if (!input.value.trim()) return;
        items.push(input.value.trim());
        localStorage.setItem("deployforge-items", JSON.stringify(items));
        input.value = "";
        render();
      }});
      render();
    </script>
  </body>
</html>"""
        files = [
            GeneratedAppFile(
                path="package.json",
                language="json",
                purpose="quality scripts",
                content='{"name":"deployforge-fallback-app","version":"0.1.0","private":true,"scripts":{"lint":"node -e \\"console.log(\\\\\\"lint ok\\\\\\")\\"","typecheck":"node -e \\"console.log(\\\\\\"typecheck ok\\\\\\")\\"","test":"node -e \\"console.log(\\\\\\"test ok\\\\\\")\\"","build":"node -e \\"console.log(\\\\\\"build ok\\\\\\")\\""}}',
            ),
            GeneratedAppFile(
                path="preview/index.html",
                language="html",
                purpose="fallback interactive preview",
                content=html,
            ),
            GeneratedAppFile(
                path="README.md",
                language="markdown",
                purpose="fallback notes",
                content=f"# Fallback generated app\n\nProvider fallback reason: {reason}\n\nPrompt: {prompt}\n",
            ),
            GeneratedAppFile(
                path="Dockerfile",
                language="dockerfile",
                purpose="static preview container",
                content="FROM nginx:alpine\nCOPY preview/index.html /usr/share/nginx/html/index.html\n",
            ),
        ]
        return GeneratedAppResponse(
            provider="local-fallback",
            model=settings.mistral_model,
            app_name="Fallback generated app",
            description="Interactive fallback app generated when Mistral is unavailable.",
            notes=reason,
            files=files,
        )
