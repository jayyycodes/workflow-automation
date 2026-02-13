# 🤖 Smart Workflow Automation

**Transform plain English into powerful automations with AI + MCP**

[![Powered by Google Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-8B5CF6?style=for-the-badge)](https://modelcontextprotocol.io/)
[![Live Demo](https://img.shields.io/badge/Live-Demo-00C853?style=for-the-badge)](https://workflow-automation-green.vercel.app/)

---

## ✨ What Is This?

Smart Workflow Automation lets you create complex automations using **plain English**. Powered by Google Gemini AI with a full **Model Context Protocol (MCP)** server, it understands your intent, builds workflows automatically, and exposes all tools to the MCP ecosystem.

### Just say:
- _"Email me top HackerNews stories every morning"_ → ✅ Done
- _"Send me AAPL stock price updates every 5 minutes"_ → ✅ Done  
- _"Notify me about weather in Mumbai daily at 8 AM"_ → ✅ Done

No coding required. Just natural language.

---

## 🎯 Live Demo

![HackerNews Email](./images/email-result.png)
*Actual email generated automatically - beautifully formatted HackerNews digest*

**Try it yourself:** [Live App](https://workflow-automation-green.vercel.app/)

---

## 🚀 Features

### 🤖 **AI-Powered Workflow Generation**
- **Google Gemini** as primary LLM (OpenRouter fallback)
- Natural language → JSON workflows with auto-retry
- Smart entity extraction + context-aware clarification
- **Self-healing AI**: auto-validates & fixes malformed workflows

### 🔌 **MCP Server (Model Context Protocol)**
- **Streamable HTTP** transport at `POST /mcp`
- **17 tools** dynamically discoverable by any MCP client
- Compatible with **Claude Desktop, Cursor, Windsurf**, and all MCP clients
- ContextMemory + execution logging for every tool call
- Stateless mode — optimized for cloud deployment (Render)

### 📋 **Tool Registry (25 Tools)**
- Centralized registry with JSON Schema definitions
- 7 categories: `data_fetch`, `web_scraping`, `data_transform`, `notification`, `action`, `control_flow`
- Dynamic handler linking at startup
- MCP-ready with `inputSchema` for each tool

### 📊 **Real-Time Data Integrations**
- **Stock Prices**: Yahoo Finance (real-time)
- **Weather**: OpenWeatherMap
- **Web Scraping**: HackerNews, GitHub, Reddit, Discord
- **Notifications**: Email (SendGrid), SMS (Twilio), WhatsApp, Slack, Discord

### ⚡ **Production-Ready Architecture**
- **Workflow Validator**: validates steps before execution
- **Context Memory**: passes data between workflow steps
- **Execution Logger**: full state tracking with Firebase
- **Cron Scheduling** for recurring automations
- **PostgreSQL** for data persistence
- **Graceful shutdown** handling

### 🎨 **Beautiful Terminal UI**
- Hacker/terminal dark theme
- Responsive design
- Real-time execution status
- Framer Motion animations

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 (App Router) + React + TailwindCSS + Framer Motion

**Backend (Node.js):**
- Express.js + PostgreSQL + Node-cron + MCP SDK

**Backend (Python AI):**
- FastAPI + Google Gemini API + OpenRouter API

**MCP Server:**
- `@modelcontextprotocol/sdk` (Streamable HTTP, stateless)
- 17 MCP-exposable tools with JSON Schema
- ContextMemory + ExecutionLogger integration

**Integrations:**
- SendGrid (email) · Twilio (SMS) · Yahoo Finance (stocks) · OpenWeatherMap (weather) · GitHub API · HackerNews API · Reddit · Discord · Slack

---

## 🏗️ Architecture

```mermaid
graph TD
    User[User Input] --> NextUI[Next.js UI]
    MCPClient[MCP Clients] --> MCPEndpoint[POST /mcp]
    NextUI --> NodeAPI[Node.js API :3000]
    MCPEndpoint --> NodeAPI
    
    subgraph Backend
    NodeAPI --> ToolReg[Tool Registry - 25 Tools]
    NodeAPI --> DB[(PostgreSQL)]
    NodeAPI --> Scheduler[Node-Cron Scheduler]
    NodeAPI --> PyService[Python AI Service]
    NodeAPI --> MCP[MCP Server - Streamable HTTP]
    MCP --> ToolReg
    end
    
    subgraph AI_Service[AI Service]
    PyService --> Gemini[Google Gemini API]
    PyService --> OpenRouter[OpenRouter Fallback]
    end
    
    subgraph Integrations
    ToolReg --> Stocks[Yahoo Finance]
    ToolReg --> Weather[OpenWeatherMap]
    ToolReg --> Email[SendGrid]
    ToolReg --> SMS[Twilio SMS]
    ToolReg --> Scraper[Web Scraper]
    end
```

---

## 🔌 MCP Server

The backend exposes a fully MCP-compatible endpoint at `POST /mcp`. Any MCP client can dynamically discover and execute tools.

### Quick Test

```bash
# Discover all available tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Execute a tool
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"fetch_weather","arguments":{"city":"Mumbai"}}}'
```

### Available MCP Tools (17)

| Tool | Category | Description |
|------|----------|-------------|
| `fetch_stock_price` | data_fetch | Real-time stock price via Yahoo Finance |
| `fetch_weather` | data_fetch | Current weather data |
| `fetch_hackernews` | web_scraping | HackerNews stories with keyword filtering |
| `scrape_github` | web_scraping | GitHub user/repo data |
| `send_email` | notification | Email via SendGrid |
| `send_sms` | notification | SMS via Twilio |
| `send_whatsapp` | notification | WhatsApp messages |
| `send_discord` | notification | Discord webhooks |
| `send_slack` | notification | Slack notifications |
| `filter_data` | data_transform | Filter/transform datasets |
| `transform_data` | data_transform | Data transformation |
| `format_web_digest` | data_transform | Format web content as digest |
| `condition` | control_flow | Conditional branching |
| `delay` | control_flow | Execution delay |
| `fetch_url` | data_fetch | Generic URL fetching |
| `job_search` | data_fetch | Job listing search |
| `job_apply` | action | Job application |

---

## 🏃 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL
- Accounts: SendGrid, Google AI Studio, OpenRouter (optional)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/jayyycodes/workflow-automation.git
cd workflow-automation

# 2. Install dependencies
npm install
cd engine-py && pip install -r requirements.txt && cd ..

# 3. Set up environment variables
cp .env.example .env
cp engine-py/.env.example engine-py/.env
# Edit .env files with your API keys

# 4. Set up database
npm run db:setup

# 5. Start all services
npm run dev                # Node.js backend (port 3000)
cd Frontend/my-app && npm run dev  # Frontend (port 5173)
cd engine-py && uvicorn app:app --reload --port 8000  # Python AI
```

### Environment Variables

```env
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/workflow_db
JWT_SECRET=your-secret-key
SENDGRID_API_KEY=your-sendgrid-key
GEMINI_API_KEY=your-gemini-key

# Optional
OPENWEATHER_API_KEY=your-weather-key
OPENROUTER_API_KEY=your-openrouter-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
MCP_TIMEOUT_MS=25000  # MCP request timeout (default: 25s)
```

---

## 🎬 How It Works

1. **User Input**: "Email me top 5 HackerNews stories daily"

2. **AI Processing** (Google Gemini):
   ```json
   {
     "name": "HackerNews Daily Digest",
     "trigger": {"type": "interval", "every": "1d"},
     "steps": [
       {"type": "scrape_hackernews", "story_type": "top", "count": 5},
       {"type": "format_web_digest", "provider": "hackernews"},
       {"type": "send_email", "subject": "Top HackerNews Stories"}
     ]
   }
   ```

3. **Validation** (Workflow Validator):
   - Validates each step against tool registry
   - Checks required parameters
   - Self-healing: AI auto-fixes invalid steps

4. **Execution** (Workflow Engine):
   - Executes steps sequentially with ContextMemory
   - Passes data between steps automatically
   - Logs every state transition to Firebase

5. **Scheduling** (Node-cron):
   - Runs automatically on schedule
   - Stores execution history

---

## 🌟 Example Automations

### Stock Monitoring
```
"Notify me when AAPL stock goes above $200"
```

### Weather Alerts
```
"Send me Mumbai weather every morning at 8 AM"
```

### Multi-Stock Email
```
"Fetch TSLA and MSFT prices and email me a summary"
```

### HackerNews Digest
```
"Email me top HackerNews stories about AI every evening"
```

### GitHub Activity
```
"Email me my GitHub activity summary every Monday"
```

---

## 📦 Project Structure

```
workflow-automation/
├── src/
│   ├── index.js                    # Express server + MCP initialization
│   ├── mcp/
│   │   ├── mcpServer.js            # MCP server factory (low-level Server API)
│   │   └── mcpRoutes.js            # POST /mcp endpoint (Streamable HTTP)
│   ├── registry/
│   │   ├── toolRegistry.js         # Centralized tool registry (25 tools)
│   │   ├── toolDefinitions.json    # JSON Schema definitions
│   │   └── mcpToolAdapter.js       # MCP ↔ Registry bridge
│   ├── automations/
│   │   ├── workflowExecutor.js     # Sequential step executor
│   │   └── stepRegistry.js         # Step handler implementations
│   ├── validation/
│   │   └── workflowValidator.js    # Validates workflows before execution
│   ├── utils/
│   │   ├── executionLogger.js      # State tracking + ContextMemory
│   │   └── logger.js               # Winston logger
│   ├── integrations/               # SendGrid, Twilio, Yahoo, etc.
│   └── routes/                     # REST API routes
├── engine-py/                      # Python AI service (FastAPI)
│   ├── app.py                      # Main server + /generate endpoint
│   ├── config.py                   # LLM configuration
│   ├── prompts.py                  # System prompts
│   └── validator.py                # Workflow validation
└── Frontend/my-app/                # Next.js frontend
```

---

## 🔥 Production Deployment

### Deploy to Render

1. **Push to GitHub**:
   ```bash
   git push origin main
   ```

2. **Create Render Services**:
   - **Node.js Backend**: Build: `npm install` / Start: `npm start`
   - **Python AI**: Build: `pip install -r requirements.txt` / Start: `uvicorn app:app --host 0.0.0.0 --port 8000`
   - **Frontend**: Build: `cd Frontend/my-app && npm install && npm run build` / Start: `npm start`

3. **Set Environment Variables** in Render dashboard

4. **Deploy** — Render auto-deploys on git push!

---

## 🤝 Contributing

Contributions welcome! Areas to explore:
- [ ] Twitter/X integration
- [ ] Google Calendar integration
- [ ] Webhook triggers
- [ ] Custom tool builder UI
- [ ] MCP authentication (OAuth2)

---

## 📄 License

MIT

---

## 🙏 Acknowledgments

- **Google Gemini** — Primary AI engine
- **Anthropic MCP** — Model Context Protocol standard
- **OpenRouter** — Fallback LLM provider
- **SendGrid** — Reliable email delivery
- **Render** — Seamless deployment

---

<div align="center">

**⚡ Transform plain English into powerful automations ⚡**

**🔌 MCP-compatible · 25 tools · AI-powered · Production-ready**

[![Powered by Google Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-8B5CF6?style=for-the-badge)](https://modelcontextprotocol.io/)

</div>
