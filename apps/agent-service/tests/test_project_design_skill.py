import asyncio

from app.core.config import settings
from app.services.agent_service import AgentService
from app.skills.project_design_skill import ProjectDesignSkill


def disable_ai_keys() -> None:
    settings.anthropic_api_key = "replace_me"
    settings.gemini_api_key = "replace_me"
    settings.google_api_key = "replace_me"
    settings.openai_api_key = "replace_me"
    settings.openrouter_api_key = "replace_me"
    settings.deepseek_api_key = "replace_me"
    settings.mistral_api_key = "replace_me"


def test_design_skill_selects_dashboard_base() -> None:
    template = ProjectDesignSkill().select("cria um dashboard azul para metricas de vendas")
    assert template.template_id == "operations-dashboard"
    assert template.app_name == "Operations Dashboard"


def test_design_skill_selects_todo_base() -> None:
    template = ProjectDesignSkill().select("faz uma to-do list com tarefas e prioridade")
    assert template.template_id == "task-list"
    assert template.app_name == "Task Flow"


def test_design_skill_exposes_langchain_tools() -> None:
    toolkit = ProjectDesignSkill().langchain_toolkit()
    tools = toolkit.tools()
    assert [tool.name for tool in tools] == ["select_project_base", "unpack_project_base"]
    selected = tools[0].invoke({"prompt": "preciso de um dashboard admin"})
    assert selected["template_id"] == "operations-dashboard"


def test_generation_prompt_includes_selected_design_base() -> None:
    service = AgentService()
    template = service.design_tools.select_template("crie um crm para leads")
    messages = service._build_generation_messages("crie um crm para leads", template)
    assert "DeployForge designer skill selected base: Pipeline CRM" in messages[1]["content"]
    assert "crm-pipeline" in messages[1]["content"]


def test_generate_app_fallback_uses_design_template() -> None:
    disable_ai_keys()
    response = asyncio.run(AgentService().generate_app("crie uma to-do list para minha equipe"))
    preview = next(file for file in response.files if file.path == "preview/index.html")
    assert response.provider == "local-fallback"
    assert response.app_name == "Task Flow"
    assert "designer skill" in preview.content
    assert "Task Flow" in preview.content
    assert "innerHTML" not in preview.content
