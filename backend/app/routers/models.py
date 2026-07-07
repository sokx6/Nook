from app.llm import list_ollama_models
from fastapi import APIRouter
from app.config import setting
router = APIRouter(prefix = "/api/models", tags=["models"])
@router.get("")
async def list_models():
    models = list_ollama_models()
    if not models:
        models = [{
            "id": f"ollama:{setting.ollama_default_model}"
            "name": setting.ollama_default_model
            "provider": "ollama",
            "local": True
        }]
    return models