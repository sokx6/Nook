from fastapi import APIRouter, Response
from app.schemas import ModifyTitleRequest, NewConversationRequest, ConversationInfo,GeneralResponse
import app.db as db
router = APIRouter()

@router.post("/api/conversations", summary="创建新会话", description="创建一个新的会话并返回其ID和标题")
def create_conversation(request: NewConversationRequest) -> ConversationInfo:
    conversation = db.create_conversations(title=request.title)
    return ConversationInfo(**conversation)

@router.get("/api/conversations/{conversation_id}",summary="获取会话详情", description="根据会话ID获取会话的详细信息")
def get_conversation(conversation_id: str, response: Response) -> ConversationInfo | GeneralResponse:
    conversation = db.get_conversation(conversation_id)
    if not conversation:
        response.status_code = 404
        return GeneralResponse(ok=False, message="会话不存在")
    return conversation

@router.get("/api/conversations", summary="获取所有会话消息", description="直接返回所有会话消息") # 注意： 此处如果会话数量过多可能会造成卡顿，建议之后改成分页
def get_all_conversations(response: Response) -> list[ConversationInfo] | GeneralResponse:
    conversations = db.get_conversations()
    if not conversations:
        response.status_code = 404
        return GeneralResponse(ok=False, message="会话未找到")
    return [conv for conv in conversations]

@router.get("/api/conversations/{conversation_id}/messages", summary="获取会话消息", description="根据会话ID获取该会话的所有消息")
def get_conversation_messages(conversation_id: str, response: Response) -> list[dict] | GeneralResponse:
    messages = db.get_messages(conversation_id)
    if not messages:
        response.status_code = 404
        return GeneralResponse(ok=False, message="消息未找到")
    return messages

@router.delete("/api/conversations/{conversation_id}", summary="删除会话", description="根据会话ID删除会话")
def delete_conversation(conversation_id: str, response: Response) -> GeneralResponse:
    success = db.delete_conversation(conversation_id)
    if not success:
        response.status_code = 404
        return GeneralResponse(ok=False, message="会话未找到")
    return GeneralResponse(ok=True, message="会话已删除")

@router.delete("/api/conversations/{conversation_id}/messages", summary="清空会话消息", description="根据会话ID清空该会话的所有消息")
def clear_conversation_messages(conversation_id: str, response: Response) -> GeneralResponse:
    success = db.clear_messages(conversation_id)
    if not success:
        response.status_code = 404
        return GeneralResponse(ok=False, message="会话未找到")
    return GeneralResponse(ok=True, message="会话消息已清空")

@router.delete("/api/conversations/{conversation_id}/messages/{message_id}", summary="删除单条消息", description="根据会话ID和消息ID删除指定消息")
def delete_message(conversation_id: str, message_id: str, response: Response) -> GeneralResponse:
    success = db.delete_message(conversation_id, message_id)
    if not success:
        response.status_code = 404
        return GeneralResponse(ok=False, message="消息未找到")
    return GeneralResponse(ok=True, message="消息已删除")

@router.get("/api/conversations", summary="根据标题查询会话", description="根据关键词搜索会话")
def search_conversations_by_title(title_keyword: str, response: Response) -> list[ConversationInfo] | GeneralResponse:
    conversations = db.search_conversations(title_keyword)
    if not conversations:
        response.status_code = 404
        return GeneralResponse(ok=False, message="未找到相关会话")
    return conversations

@router.get("/api/conversations", summary="根据内容查询会话", description="根据关键词搜索会话")
def search_conversations_by_content(keyword: str, response: Response) -> list[ConversationInfo] | GeneralResponse:
    conversations = db.search_conversations_by_all(keyword)
    if not conversations:
        response.status_code = 404
        return GeneralResponse(ok=False, message="未找到相关会话")
    return conversations

@router.put("/api/conversations/{conversation_id}/title", summary="修改会话标题", description="根据会话ID修改会话标题")
def update_conversation_title(conversation_id: str, request: ModifyTitleRequest, response: Response) -> GeneralResponse:
    success = db.update_title(conversation_id, request.new_title)
    if not success:
        response.status_code = 404
        return GeneralResponse(ok=False, message="会话未找到")
    return GeneralResponse(ok=True, message="会话标题已更新")