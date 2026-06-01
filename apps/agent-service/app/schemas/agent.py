from pydantic import BaseModel, Field


class AgentRequest(BaseModel):
    prompt: str = Field(min_length=2, max_length=12000)


class AgentResponse(BaseModel):
    mode: str
    response: str
    provider: str
    model: str


class GeneratedAppFile(BaseModel):
    path: str = Field(min_length=1, max_length=180)
    content: str = Field(min_length=1, max_length=120_000)
    language: str = Field(default="text", max_length=40)
    purpose: str = Field(default="", max_length=240)


class GeneratedAppResponse(BaseModel):
    mode: str = "generate-app"
    provider: str
    model: str
    app_name: str = Field(min_length=1, max_length=80)
    description: str = Field(min_length=1, max_length=500)
    files: list[GeneratedAppFile] = Field(min_length=1, max_length=18)
    notes: str = Field(default="", max_length=4000)


class HealthResponse(BaseModel):
    status: str
    service: str


class AIProviderStatus(BaseModel):
    provider: str
    model: str
    configured: bool
    priority: int


class AIProviderInventoryResponse(BaseModel):
    providers: list[AIProviderStatus]
