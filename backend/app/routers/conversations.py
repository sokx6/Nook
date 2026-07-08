from fastapi import APIRouter
from app.schemas import NewConversationRequest, ConversationInfo
router = APIRouter()

@router.post("/api/conversations", summary="创建新会话", description="创建一个新的会话并返回其ID和标题")
async def create_conversation(request: NewConversationRequest) -> ConversationInfo:
    from app.db import create_conversations
    conversation = create_conversations(title=request.title)
    return ConversationInfo(**conversation)