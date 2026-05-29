from fastapi.testclient import TestClient

from app.main import create_app


def test_health() -> None:
    client = TestClient(create_app())
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_plan_fallback() -> None:
    client = TestClient(create_app())
    response = client.post("/agent/plan", json={"prompt": "Planeje um microserviço de billing"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["mode"] == "plan"
    assert payload["provider"] in {"local-fallback", "mistral"}
