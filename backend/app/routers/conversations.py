from fastapi import APIRouter, Response
from app.schemas import NewConversationRequest, ConversationInfo,GeneralResponse
import app.db as db
router = APIRouter()

@router.post("/api/conversations", summary="创建新会话", description="创建一个新的会话并返回其ID和标题")
async def create_conversation(request: NewConversationRequest) -> ConversationInfo:
    conversation = db.create_conversations(title=request.title)
    return ConversationInfo(**conversation)

@router.get("/api/conversations/{conversation_id}",summary="获取会话详情", description="根据会话ID获取会话的详细信息")
async def get_conversation(conversation_id: str, response: Response) -> ConversationInfo:
    conversation = db.get_conversation(conversation_id)
    if not conversation:
        response.status_code = 404
        return {"ok": False, "message": "会话不存在"}
    return conversation

@router.get("/api/conversations", summary="获取所有会话消息", description="直接返回所有会话消息") # 注意： 此处如果会话数量过多可能会造成卡顿，建议之后改成分页
async def get_all_conversations(response: Response) -> list[ConversationInfo]:
    conversations = db.get_conversations()
    if not conversations:
        response.status_code = 404
        return {"ok": False, "message": "没有会话"}
    return [conv for conv in conversations]

@router.delete("/api/conversations/{conversation_id}", summary="删除会话", description="根据会话ID删除会话")
async def delete_conversation(conversation_id: str, response: Response) -> dict:
    success = db.delete_conversation(conversation_id)
    if not success:
        response.status_code = 404
        return {"ok": False, "message": "会话不存在"}
    return {"ok": True, "message": "会话已删除"}

@router.delete("/api/conversations/{conversation_id}/messages", summary="清空会话消息", description="根据会话ID清空该会话的所有消息")
async def clear_conversation_messages(conversation_id: str, response: Response) -> GeneralResponse:
    success = db.clear_messages(conversation_id)
    if not success:
        response.status_code = 404
        return {"ok": False, "message": "会话不存在"}
    return {"ok": True, "message": "会话消息已清空"}