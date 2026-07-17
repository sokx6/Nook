# Nook

基于 Ollama 本地模型的 AI 聊天桌面应用。纯离线运行，数据不上云。

- **前端**：Electron + React 19 + TypeScript + Ant Design 6
- **后端**：Python FastAPI，内嵌于 Electron 主进程
- **模型**：通过 Ollama 运行 qwen2.5 / llama3.2 / deepseek-r1 等开源模型
- **平台**：Windows (x64)、Linux (x64)

<p align="center">
  <img src="frontend/src/renderer/assets/nook.svg" alt="Nook" width="80" />
</p>

---

## 功能特性

- 💬 **多会话管理** — 创建、重命名、删除对话，会话数据本地 SQLite 存储
- ⚡ **流式响应** — 基于 SSE（Server-Sent Events）实时逐字输出
- 🎨 **明暗主题** — 自动跟随系统 / 手动切换，CSS 变量驱动的平滑过渡
- 📦 **模型管理** — 查看已安装的 Ollama 模型，支持一键下载常用模型
- 🔍 **全文搜索** — 按标题或消息内容搜索历史对话
- 🔄 **消息操作** — 重新生成回复、删除单条消息、复制 Markdown 内容
- 📐 **Markdown 渲染** — 支持 KaTeX 数学公式、Prism 代码高亮、表格
- 🛡️ **敏感词过滤** — 可配置的敏感词中间件拦截
- 🚀 **一键启动** — Electron 主进程自动拉起后端，无需手动操作

---

## 安装使用

从 [Releases](https://github.com/sokx6/Nook/releases) 下载对应平台的安装包。

### 前置条件

安装 [Ollama](https://ollama.com/download) 并拉取至少一个模型：

```bash
# 安装 Ollama 后拉取默认模型
ollama pull qwen2.5:1.5b

# 其他可选模型
ollama pull qwen2.5:3b
ollama pull qwen2.5:7b
ollama pull llama3.2:3b
ollama pull deepseek-r1:1.5b
```

### Windows

下载 `Nook-x.x.x-setup-x64.exe`，双击运行安装向导。

- 安装程序自动检测 Ollama，未安装时静默下载安装
- 完成后从桌面快捷方式或开始菜单启动

### Linux（x64）

```bash
tar -xzf nook-linux-x64.tar.gz
cd Nook-linux-x64
./install.sh
```

- 安装到 `~/.local/share/nook`，创建应用菜单入口
- 启动脚本自动检测 Ollama 服务，未运行时后台拉起

从应用菜单打开 Nook，或运行：

```bash
~/.local/share/nook/launch.sh
```

Ollama 后台日志位于 `~/.local/state/nook/ollama.log`。

### 数据目录

| 平台    | 路径                                  |
| ------- | ------------------------------------- |
| Windows | `%APPDATA%\Nook\chatbot.sqlite3`      |
| Linux   | `~/.local/share/nook/chatbot.sqlite3` |

删除数据库文件即可重置所有数据。

---

## 开发指南

### 环境要求

| 依赖    | 版本   |
| ------- | ------ |
| Python  | 3.10+  |
| Node.js | 18+    |
| Ollama  | 最新版 |

### 1. 克隆并安装依赖

```bash
git clone https://github.com/sokx6/Nook.git
cd Nook

# 后端
cd backend
python -m venv .venv
source .venv/bin/activate   # Linux/macOS
# .venv\Scripts\activate    # Windows
pip install -r requirements.txt

# 前端
cd ../frontend
npm install
```

### 2. 启动开发服务

确保 Ollama 正在运行（`ollama serve`），然后：

**终端 1 — 后端：**

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 11451
```

**终端 2 — 前端 (Electron + Vite HMR)：**

```bash
cd frontend
npm run dev
```

- 后端 API 文档：http://localhost:11451/docs
- Swagger UI 可直接调试全部接口

### 3. 环境变量

| 变量               | 默认值                   | 说明            |
| ------------------ | ------------------------ | --------------- |
| `NOOK_MODEL`       | `qwen2.5:1.5b`           | 默认模型        |
| `NOOK_OLLAMA_HOST` | `http://localhost:11434` | Ollama 服务地址 |
| `NOOK_HOST`        | `0.0.0.0`                | 后端监听地址    |
| `NOOK_PORT`        | `11451`                  | 后端监听端口    |

---

## API 概览

| 方法     | 路径                                        | 说明                                |
| -------- | ------------------------------------------- | ----------------------------------- |
| `GET`    | `/health`                                   | 健康检查                            |
| `GET`    | `/api/models`                               | 获取已安装模型列表                  |
| `POST`   | `/api/models/pull?model_name=...`           | 拉取模型                            |
| `POST`   | `/api/conversations`                        | 创建会话                            |
| `GET`    | `/api/conversations`                        | 获取会话列表，支持 `?keyword=` 搜索 |
| `GET`    | `/api/conversations/{id}`                   | 获取会话详情                        |
| `PUT`    | `/api/conversations/{id}/title`             | 重命名会话                          |
| `DELETE` | `/api/conversations/{id}`                   | 删除会话                            |
| `GET`    | `/api/conversations/{id}/messages`          | 获取会话消息                        |
| `DELETE` | `/api/conversations/{id}/messages`          | 清空会话消息                        |
| `DELETE` | `/api/conversations/{id}/messages/{msg_id}` | 删除单条消息                        |
| `POST`   | `/api/chat/stream`                          | SSE 流式聊天                        |

完整 API 文档：https://s.apifox.cn/a57d8daf-1db4-41a0-81ca-fbe50e73991b

---

## 项目架构

```
Nook/
├── frontend/                      # Electron + React 桌面端
│   ├── electron/
│   │   ├── main.ts                # 主进程：窗口管理、拉起后端、IPC
│   │   └── preload.ts             # 预加载脚本（contextBridge）
│   ├── src/
│   │   ├── App.tsx                # 根组件（布局、主题、响应式）
│   │   ├── main.tsx               # React 入口
│   │   ├── components/
│   │   │   ├── Sidebar.tsx        # 侧边栏：会话列表、CRUD
│   │   │   ├── ChatInput.tsx      # 输入框（Enter 发送 / Shift+Enter 换行）
│   │   │   ├── ChatMessage.tsx    # 消息气泡（Markdown + 代码高亮 + KaTeX）
│   │   │   ├── ModelSelector.tsx  # 模型选择器 + 模型下载
│   │   │   └── Search.tsx         # 全文搜索面板
│   │   ├── hooks/
│   │   │   └── useStreamChat.ts   # SSE 流式聊天 Hook（含重新生成/删除）
│   │   ├── stores/
│   │   │   ├── chatStore.ts       # 聊天状态（Zustand）
│   │   │   ├── conversationStore.ts # 会话状态 + API 调用
│   │   │   ├── modelStore.ts      # 模型状态
│   │   │   └── settingsStore.ts   # 设置（后端地址、默认模型）
│   │   ├── styles/
│   │   │   └── globals.css        # 全局样式 + 明暗主题 CSS 变量
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript 类型定义
│   │   └── renderer/assets/       # 图标（logo / nook / nook_dark）
│   ├── electron.vite.config.ts
│   └── package.json
├── backend/                       # Python FastAPI 后端
│   ├── requirements.txt
│   ├── nook-backend.spec          # PyInstaller 打包配置
│   └── app/
│       ├── main.py                # 入口：注册路由、敏感词中间件、CORS
│       ├── config.py              # 配置（环境变量 / 数据目录 / 默认模型）
│       ├── db.py                  # SQLite 操作层（CRUD + 全文搜索）
│       ├── llm.py                 # Ollama SDK 封装（流式聊天 / 模型列表 / 拉取）
│       ├── schemas.py             # Pydantic 请求/响应模型
│       ├── data/sensitive.txt     # 敏感词列表
│       └── routers/
│           ├── health.py          # GET /health
│           ├── models.py          # GET /api/models, POST /api/models/pull
│           ├── conversations.py   # 会话 CRUD + 消息管理 + 搜索
│           └── chat.py            # POST /api/chat/stream (SSE)
├── packaging/linux/               # Linux 安装/启动脚本
│   ├── install.sh                 # 安装到 ~/.local/share/nook
│   └── launch.sh                  # 启动脚本（检测 Ollama）
├── Nook.iss                       # Windows Inno Setup 安装包配置
├── build-linux.sh                 # Linux 打包脚本
└── installer/                     # 预构建安装包输出目录
```

### 核心数据流

```
用户输入 → ChatInput
  → useStreamChat.sendMessage()
    → POST /api/chat/stream (SSE)
      → chat.py: 查会话 → 取历史 → build_messages()
        → llm.py: stream_ollama() → AsyncClient.chat(stream=True)
          → Ollama Server (localhost:11434)
      ← StreamingResponse (text/event-stream)
    → updateLastAssistantMessage() (逐字更新 UI)
  → 流结束后 db.add_message() 持久化 user + assistant
```

### 数据库 ER

```
┌─────────────────┐       ┌─────────────────┐
│  conversations  │       │    messages     │
├─────────────────┤       ├─────────────────┤
│ id (TEXT PK)    │──┐    │ id (TEXT PK)    │
│ title (TEXT)    │  │    │ conversation_id │
│ created_at      │  └───>│   (TEXT FK)     │
│ updated_at      │       │ role (TEXT)     │
└─────────────────┘       │ content (TEXT)  │
                          │ created_at      │
                          └─────────────────┘
```

### 技术栈速览

| 层       | 技术                                        |
| -------- | ------------------------------------------- |
| 桌面框架 | Electron 43                                 |
| 构建工具 | electron-vite + Vite 6                      |
| UI 框架  | React 19 + Ant Design 6                     |
| 状态管理 | Zustand 5                                   |
| Markdown | react-markdown + remark-math + rehype-katex |
| 代码高亮 | prism-react-renderer                        |
| 后端框架 | FastAPI + Uvicorn                           |
| AI SDK   | Ollama Python SDK (AsyncClient)             |
| 数据库   | SQLite (WAL 模式, foreign keys)             |
| 打包     | electron-builder + PyInstaller + Inno Setup |

---

## 构建发布

### 构建后端

```bash
cd backend
pip install pyinstaller
pyinstaller nook-backend.spec
# 产物: backend/dist/nook-backend (Linux) / nook-backend.exe (Windows)
```

### 构建前端

```bash
cd frontend
npm run build          # 编译 TypeScript + Vite
npm run package        # electron-builder 打包
# 产物: frontend/release/Nook-{platform}-x64/
```

### Windows 安装包

需要 [Inno Setup 6](https://jrsoftware.org/isinfo.php)。

```powershell
# 将后端 exe 放入 Electron resources
copy backend\dist\nook-backend.exe frontend\release\Nook-win32-x64\resources\backend\

# 编译安装包
& "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" Nook.iss
# 产物: installer/Nook-x.x.x-setup-x64.exe
```

### Linux 安装包

```bash
cp backend/dist/nook-backend frontend/release/Nook-linux-x64/resources/backend/
bash build-linux.sh
# 产物: installer/nook-linux-x64.tar.gz
```

---

## License

[GPL-3.0](LICENSE)
