from fastapi import APIRouter

from app.schemas.agent import AgentRequest, AgentResponse, GeneratedAppResponse, HealthResponse
from app.services.agent_service import AgentService

router = APIRouter(tags=["agent"])
agent_service = AgentService()


@router.post("/agent/plan", response_model=AgentResponse)
async def plan(request: AgentRequest) -> AgentResponse:
    return await agent_service.plan(request.prompt)


@router.post("/agent/analyze", response_model=AgentResponse)
async def analyze(request: AgentRequest) -> AgentResponse:
    return await agent_service.analyze(request.prompt)


@router.post("/agent/generate-app", response_model=GeneratedAppResponse)
async def generate_app(request: AgentRequest) -> GeneratedAppResponse:
    return await agent_service.generate_app(request.prompt)


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="agent-service")


@router.get("/ready", response_model=HealthResponse)
def ready() -> HealthResponse:
    return HealthResponse(status="ready", service="agent-service")
