# Nook

一个基于本地模型的AI聊天机器人。

---

## 开发快速启动

### 1. 环境准备

#### 1.1 安装 Ollama

```bash
# Linux / WSL（官方一行命令）
curl -fsSL https://ollama.com/install.sh | sh

# macOS 也可以用 Homebrew
brew install ollama

# Windows：去 https://ollama.com/download 下载安装包双击安装

# 检查是否安装成功
ollama --version
```

#### 1.2 拉取模型

```bash
# 拉一个轻量模型，CPU 也能跑（本项目默认用这个）
ollama pull qwen2.5:1.5b

# 或者拉稍大一点的，效果更好但更慢
ollama pull qwen2.5:3b
ollama pull llama3.2:1b

# 查看本地已安装的模型
ollama list
```

#### 1.3 启动 Ollama 服务

```bash
# 后台启动（默认监听 localhost:11434）
ollama serve &

# 验证服务是否正常
curl http://localhost:11434/api/tags
```

#### 1.4 Python 环境

```bash
# 需要 Python 3.10+
python3 --version

# 建议使用虚拟环境
cd backend
python3 -m venv .venv
source .venv/bin/activate     # Linux/macOS
# .venv\Scripts\activate      # Windows
```

---

### 2. 安装后端依赖

```bash
cd backend
pip install -r requirements.txt
```

依赖清单（`requirements.txt`）：

| 包 | 版本 | 用途 |
|---|---|---|
| `fastapi` | >=0.115.0 | Web 框架 |
| `uvicorn[standard]` | >=0.30.0 | ASGI 服务器 |
| `ollama` | >=0.4.0 | Ollama Python SDK |

---

### 3. 启动后端服务

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

启动后：
- API 文档（Swagger UI）： http://localhost:8000/docs
- API 文档（ReDoc）： http://localhost:8000/redoc
- 数据库文件自动创建在 `data/chatbot.sqlite3`（项目根目录下）

---

### 4. API 文档

完整 API 文档请参阅：https://s.apifox.cn/a57d8daf-1db4-41a0-81ca-fbe50e73991b

---

### 5. 运行测试
> [!WARNING] 测试脚本已过时，待更新
```bash
# 确保 Ollama 和后端服务都在运行
bash backend/test_api.sh
```

测试脚本覆盖：健康检查 → 模型列表 → 创建/查询/删除会话 → SSE 流式聊天 → 清空消息 → 验证删除。

---

### 6. 项目架构

```
backend/
├── requirements.txt          # Python 依赖
├── test_api.sh               # 集成测试脚本
└── app/
    ├── __init__.py
    ├── main.py               # FastAPI 入口，注册路由和中间件
    ├── config.py             # 全局配置（默认模型名等）
    ├── db.py                 # SQLite 数据库操作层
    ├── llm.py                # Ollama 模型调用（流式聊天、模型列表）
    ├── schemas.py            # Pydantic 数据模型（请求/响应）
    └── routers/
        ├── __init__.py
        ├── health.py         # /health 健康检查
        ├── models.py         # /api/models 模型列表
        ├── conversations.py  # /api/conversations/* 会话 CRUD
        └── chat.py           # /api/chat/stream SSE 流式聊天
```

核心数据流：

```
Client (SSE) → POST /api/chat/stream → chat.py
    → db.py (查会话、取历史)
    → llm.py (build_system_prompt → build_messages → stream_ollama)
    → Ollama Server (localhost:11434)
    → StreamingResponse (text/event-stream)
    → db.py (存储 user + assistant 消息)
```

数据库 ER 图：

```
┌──────────────┐       ┌──────────────┐
│ conversations│       │   messages   │
├──────────────┤       ├──────────────┤
│ id (PK)      │──┐    │ id (PK)      │
│ title        │  │    │ conversation │
│ created_at   │  └───>│ _id (FK)     │
│ updated_at   │       │ role         │
└──────────────┘       │ content      │
                       │ created_at   │
                       └──────────────┘
```

---

### 7. 注意事项

1. **默认模型**：后端默认使用 `qwen2.5:1.5b`，如果 Ollama 中没有该模型，聊天会失败。先用 `ollama pull qwen2.5:1.5b` 拉取。
2. **模型配置**：在 `app/config.py` 中修改 `ollama_default_model` 可更换默认模型。
3. **CORS**：开发阶段 CORS 全开（`allow_origins=["*"]`），生产环境会收紧。
4. **数据库位置**：SQLite 文件在项目根目录 `data/chatbot.sqlite3`，按需手动删除即可重置。
5. **消息限制**：`build_messages()` 只取最近 20 条历史消息，避免超出小模型的上下文窗口。
