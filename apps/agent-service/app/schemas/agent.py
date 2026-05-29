from pydantic import BaseModel, Field


class AgentRequest(BaseModel):
    prompt: str = Field(min_length=2, max_length=12000)


class AgentResponse(BaseModel):
    mode: str
    response: str
    provider: str
    model: str


class HealthResponse(BaseModel):
    status: str
    service: str
