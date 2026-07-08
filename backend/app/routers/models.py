from app.llm import list_ollama_models
from app.config import setting
from fastapi import APIRouter
from app.schemas import ModelInfo

router = APIRouter()

@router.get("/api/models", summary="获取模型列表", description="获取可用的模型列表，包括本地和远程模型")
async def list_models() -> list[ModelInfo]:
    models = list_ollama_models()
    if not models:
        models = [{
            "id": f"ollama:{setting.ollama_default_model}",
            "name": setting.ollama_default_model,
            "provider": "ollama",
            "local": True
        }]
    return models