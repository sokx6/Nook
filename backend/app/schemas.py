from pydantic import BaseModel, Field

class GeneralResponse(BaseModel):
    '''通用响应，在不需要返回实际数据只需要返回状态的时候使用'''
    ok: bool = Field(default=False, description="响应状态")
    message: str = Field(default="success", description="响应消息")
    
class HealthResponse(BaseModel):
    '''健康检查响应'''
    ok: bool = Field(default=True, description="健康检查状态")
    version: str = Field(default="0.1.0", description="版本号")

class ModelInfo(BaseModel):
    '''模型信息'''
    id: str = Field(default=None, description="模型ID")
    name: str = Field(default="qwen2.5:1.5b", description="模型名称")
    provider: str = Field(default="ollama", description="模型提供商")
    local: bool = Field(default=True, description="是否为本地模型")

class UsageInfo(BaseModel):
    '''用量信息'''
    prompt_tokens: int = Field(default=0, description="提示词token数")
    completion_tokens: int = Field(default=0, description="输出token数")
    total_tokens: int = Field(default=0, description="总令牌数")

class SSEChatData(BaseModel):
    '''SSE聊天流数据'''
    type: str = Field(default="message", description="数据类型")
    content: str = Field(default="", description="消息内容")
    finish_reason: str | None = Field(default="", description="完成原因")
    usage: UsageInfo | None = Field(default=None, description="用量信息")
    
class SSEChatResponse(BaseModel):
    '''SSE聊天流响应'''
    data: SSEChatData = Field(default=None, description="数据内容")
    event: str = Field(default="message", description="事件类型")
    id: str = Field(default=None, description="事件ID")
    
class ChatRequest(BaseModel):
    '''聊天请求'''
    message: str = Field(default=None, description="用户消息")
    conversation_id: str = Field(default=None, description="会话ID")
    model: str = Field(default="qwen2.5:1.5b", description="模型名称")
    
class ConversationInfo(BaseModel):
    '''会话信息'''
    id: str = Field(default=None, description="会话ID")
    title: str = Field(default=None, description="会话标题")
    created_at: str = Field(default=None, description="创建时间")
    updated_at: str = Field(default=None, description="更新时间")

class NewConversationRequest(BaseModel):
    '''新建会话请求'''
    title: str = Field(default=None, description="会话标题")