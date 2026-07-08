from fastapi import APIRouter, Response
from fastapi.responses import StreamingResponse
from app.schemas import ChatRequest, SSEChatData
from app.llm import stream_ollama, build_system_prompt, build_messages
import app.db as db

router = APIRouter()

@router.post("/api/chat/stream", summary="聊天流式响应", description="使用SSE进行流式响应，返回聊天消息")
async def chat_stream(request: ChatRequest, response: Response):
    # 1. 检查会话是否存在
    conversation = db.get_conversation(request.conversation_id)
    if not conversation:
        response.status_code = 404
        return {"ok": False, "message": "会话不存在"}

    # 2. 取历史消息 & 拼装 messages
    history = db.get_messages(request.conversation_id)
    system_prompt = build_system_prompt()
    messages = build_messages(system_prompt, history, request.message)

    # 3. SSE 流式生成器
    async def generate():
        full_response = ""
        event_id = 0
        async for chunk in stream_ollama(request.model, messages):
            event_id += 1
            full_response += chunk
            data = SSEChatData(content=chunk, finish_reason=None)
            yield f"event: message\nid: {event_id}\ndata: {data.model_dump_json()}\n\n"

        # 结束标记
        event_id += 1
        done = SSEChatData(content="", finish_reason="stop")
        yield f"event: message\nid: {event_id}\ndata: {done.model_dump_json()}\n\n"
        yield "data: [DONE]\n\n"

        # 4. 流结束后存储用户消息和 AI 回复
        db.add_message(request.conversation_id, "user", request.message)
        db.add_message(request.conversation_id, "assistant", full_response)

    return StreamingResponse(generate(), media_type="text/event-stream")
       
