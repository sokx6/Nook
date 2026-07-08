from fastapi import APIRouter
from app.schemas import HealthResponse

router = APIRouter()

@router.get("/health", summary="健康检查", description="检查服务是否正常运行")
async def health_check():
    return HealthResponse(ok=True, version="0.1.0")