from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import create_app


def test_health() -> None:
    client = TestClient(create_app())
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_plan_fallback() -> None:
    settings.mistral_api_key = "replace_me"
    client = TestClient(create_app())
    response = client.post("/agent/plan", json={"prompt": "Planeje um microserviço de billing"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["mode"] == "plan"
    assert payload["provider"] in {"local-fallback", "mistral"}


def test_generate_app_fallback_returns_files() -> None:
    settings.mistral_api_key = "replace_me"
    client = TestClient(create_app())
    response = client.post("/agent/generate-app", json={"prompt": "Crie um CRM simples"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["mode"] == "generate-app"
    assert payload["provider"] == "local-fallback"
    assert any(file["path"] == "preview/index.html" for file in payload["files"])
