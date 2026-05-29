from fastapi import FastAPI

from app.api.routes.agent import router as agent_router
from app.core.logging import configure_logging


def create_app() -> FastAPI:
    configure_logging()
    app = FastAPI(title="DeployForge AI Agent Service", version="0.1.0")
    app.include_router(agent_router)
    return app


app = create_app()
