from app.llm import list_ollama_models
from app.config import setting
from fastapi import APIRouter
from app.schemas import ModelInfo,GeneralResponse

router = APIRouter()

@router.get("/api/models", summary="获取模型列表", description="获取可用的模型列表，包括本地和远程模型")
async def list_models() -> list[ModelInfo]:
    models = list_ollama_models()
    if not models:
        return GeneralResponse(ok=False, message="未找到可用模型")
    return models