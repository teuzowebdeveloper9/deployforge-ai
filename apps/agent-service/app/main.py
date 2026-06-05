from hmac import compare_digest

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.routes.agent import router as agent_router
from app.core.config import settings
from app.core.logging import configure_logging


def create_app() -> FastAPI:
    configure_logging()
    app = FastAPI(title="DeployForge AI Agent Service", version="0.1.0")

    @app.middleware("http")
    async def require_gateway_token(request: Request, call_next):
        if settings.gateway_service_token and request.url.path.startswith("/agent/"):
            token = request.headers.get("x-gateway-token", "")
            if not compare_digest(token, settings.gateway_service_token):
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Gateway authentication required"},
                    headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"},
                )
        return await call_next(request)

    app.include_router(agent_router)
    return app


app = create_app()
