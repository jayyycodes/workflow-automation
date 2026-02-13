# Design Document
## Smart Workflow Automation - AI for Bharat Hackathon

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Next.js UI<br/>Terminal Theme<br/>Framer Motion]
    end
    
    subgraph "Application Layer - Node.js Backend"
        API[Express.js API<br/>Port 3000]
        Scheduler[Node-Cron<br/>Scheduler]
        Executor[Workflow<br/>Executor]
    end
    
    subgraph "AI Service Layer - Python"
        AI[FastAPI Service<br/>Port 8000]
        Gemini[Google Gemini<br/>gemini-1.5-flash]
        OpenRouter[OpenRouter API<br/>Fallback LLM]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL<br/>Users, Automations<br/>Executions)]
    end
    
    subgraph "Integration Layer"
        Email[SendGrid<br/>Email]
        SMS[Twilio<br/>SMS]
        WhatsApp[Twilio<br/>WhatsApp]
        Stock[Yahoo Finance<br/>Stock Prices]
        Weather[OpenWeatherMap<br/>Weather Data]
        Web[Web Scrapers<br/>HackerNews, GitHub]
    end
    
    UI --> API
    API --> Scheduler
    API --> Executor
    API --> DB
    API --> AI
    
    AI --> Gemini
    AI -.Fallback.-> OpenRouter
    
    Executor --> Email
    Executor --> SMS
    Executor --> WhatsApp
    Executor --> Stock
    Executor --> Weather
    Executor --> Web
    
    Scheduler --> Executor
```

### 1.2 Architecture Principles

**Separation of Concerns**:
- Frontend (Next.js) handles UI/UX only
- Backend (Node.js) manages business logic, data persistence, execution
- AI Service (Python) focuses solely on NLP and workflow generation
- Integrations are isolated, adapter-based modules

**Scalability**:
- Stateless API design (JWT authentication)
- Database connection pooling
- Asynchronous step execution
- Horizontally scalable (multiple instances via load balancer)

**Reliability**:
- Fallback AI provider (OpenRouter if Gemini fails)
- Comprehensive error handling and logging
- Graceful degradation (scheduler continues if one automation fails)
- Database transactions for critical operations

**Maintainability**:
- Modular step registry (easy to add new step types)
- Adapter pattern for web scrapers (standardized interface)
- Clear folder structure with separation by concern
- Detailed logging with context

---

## 2. Component Design

### 2.1 Frontend (Next.js)

#### 2.1.1 File Structure
```
Frontend/my-app/
├── app/
│   ├── page.js                 # Landing page
│   ├── login/page.js           # Login page
│   ├── register/page.js        # Registration page
│   ├── dashboard/page.js       # Main dashboard
│   ├── layout.js               # Root layout
│   └── globals.css             # Global styles
├── components/                 # Reusable components (if extracted)
└── public/                     # Static assets
```

#### 2.1.2 Key Components

**Landing Page (`app/page.js`)**:
- Hero section with terminal-themed animation
- Problem/solution statement
- Key features showcase
- Live demo CTA
- Responsive design

**Authentication Pages**:
- Login: Email/password form, JWT storage in localStorage
- Register: Email, password, name, optional WhatsApp number
- Redirect to dashboard on success

**Dashboard (`app/dashboard/page.js`)**:
- Automation list with status badges
- Start/Stop toggle buttons
- Test Run and View Results buttons
- Create Automation modal with AI input
- Execution results modal with step details
- Real-time updates and loading states

#### 2.1.3 State Management
- React hooks (`useState`, `useEffect`) for local state
- `localStorage` for JWT token persistence
- No global state library needed (simple app)

#### 2.1.4 Styling
- **TailwindCSS** for utility-first styling
- **Custom CSS** for terminal theme (monospace fonts, green accents, dark background)
- **Framer Motion** for smooth animations (page transitions, modals, buttons)

#### 2.1.5 API Communication
- Fetch API for HTTP requests
- Base URL from environment variable (`NEXT_PUBLIC_API_URL`)
- JWT token included in `Authorization: Bearer <token>` header
- Error handling with user-friendly messages

---

### 2.2 Backend API (Node.js/Express)

#### 2.2.1 Folder Structure
```
src/
├── index.js                    # Server entry point
├── config/
│   └── db.js                   # PostgreSQL connection pool
├── models/
│   ├── User.js                 # User CRUD operations
│   ├── Automation.js           # Automation CRUD operations
│   └── Execution.js            # Execution tracking
├── routes/
│   ├── auth.js                 # /auth routes (register, login)
│   ├── automations.js          # /automations routes
│   └── user.js                 # /user routes (profile)
├── controllers/
│   ├── authController.js       # Auth business logic
│   └── automationController.js # Automation business logic
├── middleware/
│   ├── auth.js                 # JWT verification middleware
│   └── errorHandler.js         # Global error handler
├── automations/
│   ├── workflowExecutor.js     # Executes workflow steps
│   └── stepRegistry.js         # Maps step types to handlers
├── scheduler/
│   ├── scheduler.js            # Node-cron scheduler manager
│   └── jobStore.js             # In-memory job tracking
├── integrations/
│   ├── email/emailService.js   # SendGrid wrapper
│   ├── sms/smsService.js       # Twilio SMS wrapper
│   ├── whatsapp/whatsappService.js # Twilio WhatsApp wrapper
│   ├── fetch/stockService.js   # Yahoo Finance wrapper
│   ├── web/
│   │   ├── webScraperService.js # Orchestrator
│   │   └── adapters/
│   │       ├── hackerNewsAdapter.js
│   │       └── githubAdapter.js
│   └── messaging/formatters.js # HTML email formatting
├── services/
│   └── aiService.js            # Proxy to Python AI service
└── utils/
    ├── constants.js            # Status enums
    └── logger.js               # Winston logger
```

#### 2.2.2 Database Schema

**Users Table**:
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  whatsapp_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Automations Table**:
```sql
CREATE TABLE automations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger JSONB NOT NULL,
  steps JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'DRAFT',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Executions Table**:
```sql
CREATE TABLE executions (
  id SERIAL PRIMARY KEY,
  automation_id INTEGER REFERENCES automations(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'PENDING',
  input JSONB,
  result JSONB,
  error TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2.2.3 API Endpoints

**Authentication**:
- `POST /auth/register` - Create new user account
- `POST /auth/login` - Authenticate and get JWT token

**Automations**:
- `GET /automations` - List user automations
- `POST /automations` - Create new automation
- `PATCH /automations/:id/status` - Start/stop automation
- `POST /automations/:id/run` - Manual test run
- `GET /automations/:id/executions` - Get execution history
- `DELETE /automations/:id` - Delete automation

**User**:
- `GET /user/me` - Get current user profile
- `PATCH /user/profile` - Update WhatsApp number

**AI Generation**:
- `POST /ai/generate` - Proxy to Python AI service

**Health**:
- `GET /health` - System health check with scheduler stats

#### 2.2.4 Workflow Executor Design

**Execution Flow**:
```mermaid
sequenceDiagram
    participant API as API Endpoint
    participant Executor as Workflow Executor
    participant Registry as Step Registry
    participant Handlers as Step Handlers
    participant DB as Database
    
    API->>DB: Create execution record (RUNNING)
    API->>Executor: executeWorkflow(automation, executionId, user)
    
    loop For each step
        Executor->>Registry: getStepHandler(step.type)
        Registry->>Handlers: Find handler function
        Handlers-->>Executor: Handler function
        Executor->>Handlers: Execute handler(step, context)
        Handlers-->>Executor: Step output
        Executor->>Executor: Store output in context
    end
    
    alt All steps success
        Executor->>DB: Update execution (SUCCESS, results)
    else Any step fails
        Executor->>DB: Update execution (FAILED, error)
    end
    
    Executor-->>API: Execution result
```

**Step Registry Pattern**:
```javascript
const stepRegistry = {
  fetch_stock_price: fetchStockPriceHandler,
  fetch_weather: fetchWeatherHandler,
  scrape_hackernews: scrapeHackerNewsHandler,
  scrape_github: scrapeGitHubHandler,
  format_web_digest: formatWebDigestHandler,
  send_email: sendEmailHandler,
  send_sms: sendSMSHandler,
  send_whatsapp: sendWhatsAppHandler
};

export const getStepHandler = (stepType) => {
  const handler = stepRegistry[stepType];
  if (!handler) throw new Error(`Unsupported step type: ${stepType}`);
  return handler;
};
```

**Context Propagation**:
Each step receives a context object:
```javascript
{
  automation: { id, name, trigger, steps },
  executionId: 123,
  user: { id, email, name, whatsapp_number },
  startTime: '2024-01-24T22:00:00Z',
  stepOutputs: {
    step_1: { /* output from step 1 */ },
    step_2: { /* output from step 2 */ }
  }
}
```

Steps can reference previous outputs using `context.stepOutputs.step_N` or named outputs.

#### 2.2.5 Scheduler Design

**Scheduler Manager** (`scheduler.js`):
- Maintains in-memory map of `automationId -> cronJob`
- Loads active automations on server startup
- Dynamically adds/removes jobs when automations start/stop
- Triggers workflow executor for each scheduled run

**Schedule Parsing**:
- Interval format: `5m`, `1h`, `1d`, `1w` → Converts to cron expression
- Cron format: `0 9 * * *` → Used directly with node-cron

**Graceful Shutdown**:
- Stops all scheduled jobs on SIGTERM/SIGINT
- Closes database connections
- Prevents orphaned jobs

---

### 2.3 AI Service (Python/FastAPI)

#### 2.3.1 File Structure
```
engine-py/
├── app.py                      # FastAPI application
├── prompts.py                  # System prompts for Gemini
├── clarification.py            # Multi-turn clarification logic
├── required_fields.py          # Field extraction rules
├── validator.py                # JSON schema validation
├── config.py                   # API keys, settings
└── requirements.txt            # Python dependencies
```

#### 2.3.2 AI Workflow Generation Pipeline

```mermaid
graph TD
    A[User Input] --> B[Intent Recognition]
    B --> C{All Required<br/>Fields Present?}
    C -->|Yes| D[Generate Workflow JSON]
    C -->|No| E[Ask Clarification<br/>Question]
    E --> F[User Response]
    F --> C
    D --> G[Schema Validation]
    G -->|Valid| H[Return Workflow]
    G -->|Invalid| I[Retry with Error<br/>Feedback]
    I --> D
```

#### 2.3.3 Prompt Engineering

**System Prompt Structure**:
1. **Role Definition**: "You are an AI automation expert..."
2. **Task Description**: "Convert natural language into workflow JSON..."
3. **Output Format**: JSON schema with examples
4. **Supported Step Types**: List with descriptions
5. **Scheduling Syntax**: Interval and cron formats
6. **Extraction Rules**: How to parse entities (stock symbols, subreddits, etc.)

**Example Prompt**:
```
You are an AI automation expert. Convert the following request into a
JSON workflow with 'name', 'trigger', and 'steps' fields.

Supported step types:
- fetch_stock_price: {...}
- scrape_hackernews: {...}
- send_email: {...}

User request: "Email me top 5 HackerNews stories daily"

Output (JSON only):
```

**Response Parsing**:
- Extracts JSON from markdown code blocks
- Handles both raw JSON and ```json...``` wrapped responses
- Falls back to regex extraction if needed

#### 2.3.4 Multi-Turn Clarification

**Required Fields Detection**:
- Analyzes generated workflow JSON
- Checks for missing required fields (e.g., stock symbol, schedule)
- Identifies ONE missing field per turn

**Question Generation**:
```python
questions = {
  "stock_symbol": "Which stock would you like to track?",
  "schedule": "How often should I check? (e.g., every 5 minutes, daily at 9 AM)",
  "notification_channel": "How would you like to be notified? (email, SMS, WhatsApp)"
}
```

**Context Accumulation**:
- Stores user responses in `context` object
- Merges new information with previous turns
- Regenerates workflow when all fields complete

**Voice vs Text Mode**:
- Voice mode: Shorter, conversational questions
- Text mode: Detailed questions with examples

#### 2.3.5 AI Provider Failover

**Google Gemini (Primary)**:
- Model: `gemini-1.5-flash`
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
- Rate Limit: 15 RPM (free tier)

**OpenRouter (Fallback)**:
- Model: `google/gemini-1.5-flash` (or similar)
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Activated on Gemini failure or timeout

**Retry Logic**:
```python
try:
    response = call_gemini(prompt)
except (APIError, TimeoutError):
    logger.warning("Gemini failed, using OpenRouter fallback")
    response = call_openrouter(prompt)
```

---

### 2.4 Integration Layer Design

#### 2.4.1 Adapter Pattern for Web Scrapers

**Interface Contract**:
Each adapter must implement:
```javascript
class WebScraperAdapter {
  async fetch(params) {
    // Fetch data from source
    // Returns: Array of items
  }
  
  async formatDigest(items, provider) {
    // Format items as HTML email
    // Returns: HTML string
  }
}
```

**HackerNews Adapter**:
```javascript
// src/integrations/web/adapters/hackerNewsAdapter.js
export const fetch = async ({ story_type, count, keyword }) => {
  const url = `https://hn.algolia.com/api/v1/search?tags=${story_type}&hitsPerPage=${count}`;
  const response = await axios.get(url);
  let stories = response.data.hits.map(hit => ({
    title: hit.title,
    url: hit.url,
    points: hit.points,
    author: hit.author,
    time: new Date(hit.created_at)
  }));
  
  if (keyword) {
    stories = stories.filter(s => s.title.toLowerCase().includes(keyword.toLowerCase()));
  }
  
  return stories;
};

export const formatDigest = (stories) => {
  // Returns rich HTML with story cards
};
```

**GitHub Adapter**:
```javascript
// src/integrations/web/adapters/githubAdapter.js
export const fetch = async ({ username, type, count }) => {
  const url = type === 'starred'
    ? `https://api.github.com/users/${username}/starred`
    : `https://api.github.com/users/${username}/repos`;
  
  const response = await axios.get(url, {
    headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` }
  });
  
  return response.data.slice(0, count).map(repo => ({
    name: repo.full_name,
    description: repo.description,
    stars: repo.stargazers_count,
    language: repo.language,
    url: repo.html_url
  }));
};
```

**Orchestrator Service**:
```javascript
// src/integrations/web/webScraperService.js
const adapters = {
  hackernews: require('./adapters/hackerNewsAdapter'),
  github: require('./adapters/githubAdapter')
};

export const scrapeWebsite = async (provider, params) => {
  const adapter = adapters[provider];
  if (!adapter) throw new Error(`Unsupported provider: ${provider}`);
  return await adapter.fetch(params);
};

export const formatWebDigest = async (items, provider) => {
  const adapter = adapters[provider];
  return await adapter.formatDigest(items, provider);
};
```

**Adding New Adapters** (3 steps):
1. Create `src/integrations/web/adapters/redditAdapter.js`
2. Implement `fetch()` and `formatDigest()` functions
3. Register in `webScraperService.js` adapters map

#### 2.4.2 Notification Services

**Email Service (SendGrid)**:
```javascript
// src/integrations/email/emailService.js
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = async ({ to, subject, html }) => {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    html
  };
  
  await sgMail.send(msg);
  logger.info(`Email sent to ${to}: ${subject}`);
};
```

**SMS Service (Twilio)**:
```javascript
// src/integrations/sms/smsService.js
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendSMS = async ({ to, body }) => {
  await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to
  });
  logger.info(`SMS sent to ${to}`);
};
```

---

## 3. Data Flow Diagrams

### 3.1 Automation Creation Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Node API
    participant Python AI
    participant Gemini
    participant Database
    
    User->>Frontend: Enter "Email me HackerNews stories daily"
    Frontend->>Node API: POST /ai/generate
    Node API->>Python AI: POST /conversation
    Python AI->>Gemini: Send prompt + user input
    Gemini-->>Python AI: Workflow JSON
    Python AI->>Python AI: Validate & parse JSON
    Python AI-->>Node API: { name, trigger, steps }
    Node API-->>Frontend: Workflow JSON
    Frontend->>Frontend: Display for review
    User->>Frontend: Click "Save Automation"
    Frontend->>Node API: POST /automations
    Node API->>Database: INSERT automation (status=DRAFT)
    Database-->>Node API: Automation record
    Node API-->>Frontend: Success response
    Frontend->>Frontend: Show in dashboard
```

### 3.2 Scheduled Execution Flow

```mermaid
sequenceDiagram
    participant Scheduler
    participant Executor
    participant Database
    participant HN API
    participant Email Service
    
    Scheduler->>Scheduler: Cron trigger (9 AM daily)
    Scheduler->>Database: Fetch automation details
    Database-->>Scheduler: Automation + user info
    Scheduler->>Executor: executeWorkflow(automation, executionId, user)
    
    Executor->>Database: Create execution (RUNNING)
    
    loop For each step
        Executor->>Executor: Step 1: scrape_hackernews
        Executor->>HN API: GET top stories
        HN API-->>Executor: Stories array
        
        Executor->>Executor: Step 2: format_web_digest
        Executor->>Executor: Generate HTML from stories
        
        Executor->>Executor: Step 3: send_email
        Executor->>Email Service: SendGrid API call
        Email Service-->>Executor: Email sent
    end
    
    Executor->>Database: Update execution (SUCCESS, results)
    Executor-->>Scheduler: Execution complete
```

### 3.3 Manual Test Run Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Executor
    participant Integrations
    
    User->>Frontend: Click "Test Run" button
    Frontend->>API: POST /automations/:id/run
    API->>API: Fetch automation from DB
    API->>Executor: executeWorkflow(automation)
    
    activate Executor
    Executor->>Integrations: Step 1 execution
    Integrations-->>Executor: Output 1
    Executor->>Integrations: Step 2 execution
    Integrations-->>Executor: Output 2
    deactivate Executor
    
    Executor-->>API: { success, steps, duration }
    API-->>Frontend: Execution results
    Frontend->>Frontend: Display results modal
    User->>User: Review step outputs
```

---

## 4. Security Architecture

### 4.1 Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Database
    
    User->>Frontend: Enter email + password
    Frontend->>API: POST /auth/login
    API->>Database: SELECT * FROM users WHERE email=?
    Database-->>API: User record (with password_hash)
    API->>API: bcrypt.compare(password, password_hash)
    
    alt Valid credentials
        API->>API: Generate JWT token
        API-->>Frontend: { token, user: { id, email, name } }
        Frontend->>Frontend: Store token in localStorage
    else Invalid credentials
        API-->>Frontend: 401 Unauthorized
    end
```

### 4.2 Authorization Middleware

```javascript
// src/middleware/auth.js
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Applied to protected routes
router.get('/automations', authenticate, getAutomations);
```

### 4.3 Data Access Control

**Ownership Verification**:
```javascript
// Ensure user can only access their own automations
const automation = await Automation.findById(id);
if (automation.user_id !== req.user.id) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

### 4.4 Environment Variable Management

**Sensitive Data Never in Code**:
- All API keys in `.env` files
- `.env` files in `.gitignore`
- `.env.example` provides template without secrets

**Production Security**:
- JWT_SECRET must be changed from default
- HTTPS enforced via deployment platform
- CORS restricted to frontend domain

---

## 5. Model Context Protocol (MCP) Integration Design

### 5.1 Architecture with MCP

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Next.js UI]
    end
    
    subgraph "Application Layer"
        API[Express API]
        Scheduler[Scheduler]
        Executor[Executor]
    end
    
    subgraph "AI Service Layer"
        AI[FastAPI AI Service]
        Gemini[Google Gemini]
    end
    
    subgraph "MCP Layer (NEW)"
        MCP[MCP Server]
        
        subgraph "MCP Resources"
            UserRes[User Context<br/>Resource]
            DataRes[Data Sources<br/>Resource]
            HistoryRes[Automation<br/>History Resource]
        end
        
        subgraph "MCP Tools"
            ValidateTool[Validate<br/>Symbol Tool]
            GetProfileTool[Get Profile<br/>Tool]
            SuggestTool[Suggest<br/>Automation Tool]
        end
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
    end
    
    UI --> API
    API --> Scheduler
    API --> Executor
    API --> AI
    API --> DB
    
    AI --> MCP
    AI --> Gemini
    
    MCP --> UserRes
    MCP --> DataRes
    MCP --> HistoryRes
    MCP --> ValidateTool
    MCP --> GetProfileTool
    MCP --> SuggestTool
    
    MCP --> DB
    MCP --> API
```

### 5.2 MCP Server Implementation

**Technology Stack**:
- **Runtime**: Node.js (same as backend)
- **MCP SDK**: `@modelcontextprotocol/sdk` (NPM package)
- **Transport**: Stdio or HTTP (HTTP for remote AI service)

**File Structure**:
```
mcp-server/
├── index.js                    # MCP server entry point
├── resources/
│   ├── userContext.js          # User profile, preferences
│   ├── dataSources.js          # Available integrations
│   └── automationHistory.js    # Past automations
├── tools/
│   ├── validateSymbol.js       # Check if stock symbol exists
│   ├── getProfile.js           # Fetch user profile
│   └── suggestAutomation.js    # AI-powered suggestions
└── config.js                   # MCP server config
```

### 5.3 MCP Resources

**User Context Resource**:
```javascript
// mcp-server/resources/userContext.js
{
  uri: "user://profile",
  name: "User Profile",
  description: "Current user's profile information",
  mimeType: "application/json",
  
  async read(userId) {
    const user = await User.findById(userId);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      whatsapp_number: user.whatsapp_number,
      preferences: {
        notification_channel: user.whatsapp_number ? 'whatsapp' : 'email'
      }
    };
  }
}
```

**Data Sources Resource**:
```javascript
// mcp-server/resources/dataSources.js
{
  uri: "datasources://available",
  name: "Available Data Sources",
  description: "List of configured integrations",
  mimeType: "application/json",
  
  async read() {
    return {
      stocks: { enabled: !!process.env.YAHOO_FINANCE_KEY },
      weather: { enabled: !!process.env.OPENWEATHER_API_KEY },
      hackernews: { enabled: true },
      github: { enabled: !!process.env.GITHUB_TOKEN },
      email: { enabled: !!process.env.SENDGRID_API_KEY },
      sms: { enabled: !!process.env.TWILIO_ACCOUNT_SID },
      whatsapp: { enabled: !!process.env.TWILIO_WHATSAPP_NUMBER }
    };
  }
}
```

**Automation History Resource**:
```javascript
// mcp-server/resources/automationHistory.js
{
  uri: "automations://history/:userId",
  name: "User's Automation History",
  description: "Past automations created by user",
  mimeType: "application/json",
  
  async read(userId) {
    const automations = await Automation.findByUserId(userId);
    return automations.map(a => ({
      name: a.name,
      trigger: a.trigger,
      stepTypes: a.steps.map(s => s.type),
      status: a.status,
      created_at: a.created_at
    }));
  }
}
```

### 5.4 MCP Tools

**Validate Stock Symbol Tool**:
```javascript
// mcp-server/tools/validateSymbol.js
{
  name: "validate_stock_symbol",
  description: "Check if a stock symbol is valid",
  inputSchema: {
    type: "object",
    properties: {
      symbol: { type: "string", description: "Stock symbol (e.g., AAPL)" }
    },
    required: ["symbol"]
  },
  
  async execute({ symbol }) {
    try {
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
      return {
        valid: true,
        name: response.data.chart.result[0].meta.longName,
        currentPrice: response.data.chart.result[0].meta.regularMarketPrice
      };
    } catch (error) {
      return { valid: false, error: 'Invalid stock symbol' };
    }
  }
}
```

**Get User Profile Tool**:
```javascript
// mcp-server/tools/getProfile.js
{
  name: "get_user_profile",
  description: "Fetch current user's profile and preferences",
  inputSchema: {
    type: "object",
    properties: {
      userId: { type: "number" }
    },
    required: ["userId"]
  },
  
  async execute({ userId }) {
    const user = await User.findById(userId);
    return {
      email: user.email,
      whatsapp_number: user.whatsapp_number,
      preferred_channel: user.whatsapp_number ? 'whatsapp' : 'email'
    };
  }
}
```

**Suggest Automation Tool**:
```javascript
// mcp-server/tools/suggestAutomation.js
{
  name: "suggest_automation",
  description: "Suggest automation based on user's history and input",
  inputSchema: {
    type: "object",
    properties: {
      userId: { type: "number" },
      currentInput: { type: "string" }
    },
    required: ["userId", "currentInput"]
  },
  
  async execute({ userId, currentInput }) {
    const history = await Automation.findByUserId(userId);
    
    // Example: If user has HackerNews automation, suggest similar for Reddit
    const hasHN = history.some(a => a.steps.some(s => s.type === 'scrape_hackernews'));
    
    if (hasHN && currentInput.includes('reddit')) {
      return {
        suggestion: "I see you have a HackerNews automation. Would you like a similar daily digest from Reddit?",
        template: {
          trigger: { type: 'interval', every: '1d' },
          steps: [
            { type: 'scrape_reddit', subreddit: 'programming', count: 10 },
            { type: 'format_web_digest', provider: 'reddit' },
            { type: 'send_email' }
          ]
        }
      };
    }
    
    return { suggestion: null };
  }
}
```

### 5.5 AI Service Integration with MCP

**Updated Workflow Generation**:
```python
# engine-py/app.py (with MCP integration)
import mcp_client  # MCP Python SDK

async def generate_workflow_with_mcp(user_input, user_id):
    # 1. Connect to MCP server
    mcp = mcp_client.connect("http://localhost:3001/mcp")
    
    # 2. Fetch user context
    user_profile = await mcp.use_tool("get_user_profile", {"userId": user_id})
    automation_history = await mcp.read_resource(f"automations://history/{user_id}")
    
    # 3. Get suggestions
    suggestion = await mcp.use_tool("suggest_automation", {
        "userId": user_id,
        "currentInput": user_input
    })
    
    # 4. Build enhanced prompt
    enhanced_prompt = f"""
    User input: {user_input}
    
    User context:
    - Email: {user_profile['email']}
    - Preferred notification: {user_profile['preferred_channel']}
    - Past automations: {len(automation_history)} created
    
    AI Suggestion: {suggestion.get('suggestion', 'None')}
    
    Generate workflow JSON:
    """
    
    # 5. Call Gemini with enhanced context
    workflow = await call_gemini(enhanced_prompt)
    
    # 6. Validate stock symbols if present
    if 'fetch_stock_price' in workflow:
        symbol = workflow['steps'][0]['symbol']
        validation = await mcp.use_tool("validate_stock_symbol", {"symbol": symbol})
        if not validation['valid']:
            raise ValueError(f"Invalid stock symbol: {symbol}")
    
    return workflow
```

### 5.6 Benefits Realized

**Before MCP**:
```
User: "Send me stock updates"
AI: "Which stock?"
User: "AAPL"
AI: "How often?"
User: "Every 5 minutes"
AI: "Via email or SMS?"
User: "Email"
→ 4 turns, 60 seconds
```

**After MCP**:
```
User: "Send me stock updates"
AI (queries MCP): User has AAPL automation, prefers email
AI: "I'll send AAPL stock updates to your email every 5 minutes, like your existing automation. Correct?"
User: "Yes"
→ 2 turns, 20 seconds
```

---

## 6. Deployment Architecture

### 6.1 Production Deployment (Render)

```mermaid
graph LR
    subgraph "Client"
        Browser
    end
    
    subgraph "Vercel (Frontend)"
        NextJS[Next.js App<br/>Static + SSR]
    end
    
    subgraph "Render (Backend Services)"
        Node[Node.js API<br/>Web Service]
        Python[Python AI<br/>Web Service]
        PG[(PostgreSQL<br/>Managed DB)]
        
        Node --> PG
        Python -.HTTP.-> Node
    end
    
    subgraph "Third-Party APIs"
        SendGrid
        Twilio
        Gemini[Google Gemini]
    end
    
    Browser --> NextJS
    NextJS --> Node
    Node --> Python
    Node --> SendGrid
    Node --> Twilio
    Python --> Gemini
```

### 6.2 Environment Configuration

**Frontend (Vercel)**:
```env
NEXT_PUBLIC_API_URL=https://workflow-automation-backend.onrender.com
```

**Node.js Backend (Render)**:
```env
DATABASE_URL=postgresql://user:pass@postgres.onrender.com:5432/workflow_db
JWT_SECRET=production-secret-key-here
SENDGRID_API_KEY=SG.xxx
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxx
GITHUB_TOKEN=ghp_xxx
OPENWEATHER_API_KEY=xxx
AI_SERVICE_URL=https://workflow-ai-service.onrender.com
NODE_ENV=production
PORT=3000
```

**Python AI (Render)**:
```env
GEMINI_API_KEY=AIzaSyxxx
OPENROUTER_API_KEY=sk-or-xxx
PORT=8000
```

### 6.3 Scaling Strategy

**Horizontal Scaling**:
- Deploy multiple instances behind load balancer
- Stateless design enables easy scaling
- Database connection pooling prevents bottleneck

**Vertical Scaling**:
- Increase RAM for node-cron scheduler (many active automations)
- Increase CPU for AI service (parallel requests)

**Database Optimization**:
- Add indexes on frequently queried fields (user_id, automation_id, status)
- Archive old execution records (> 90 days)
- Read replicas for analytics queries

---

## 7. Performance Optimization

### 7.1 Frontend Optimization
- **Code Splitting**: Next.js automatic code splitting
- **Image Optimization**: Next.js `<Image>` component
- **Static Generation**: Landing page pre-rendered at build time
- **Lazy Loading**: Modals and heavy components load on demand

### 7.2 Backend Optimization
- **Connection Pooling**: PostgreSQL connection pool (max 20 connections)
- **Caching**: In-memory caching for frequently accessed data (user profiles)
- **Async Execution**: All I/O operations are asynchronous
- **Batch Operations**: Bulk load automations on startup

### 7.3 AI Service Optimization
- **Prompt Caching**: Cache common system prompts
- **Request Batching**: Group multiple AI requests if possible
- **Timeout Handling**: 10s timeout, fail to fallback provider

---

## 8. Monitoring and Observability

### 8.1 Logging Strategy

**Winston Logger Configuration**:
```javascript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

**Log Levels**:
- **error**: Failures requiring immediate attention (DB down, API errors)
- **warn**: Degraded functionality (fallback API used, rate limit approaching)
- **info**: Important events (user registration, automation created, execution completed)
- **debug**: Detailed debugging info (step outputs, context data)

### 8.2 Health Monitoring

**Health Endpoint** (`GET /health`):
```json
{
  "status": "ok",
  "timestamp": "2024-01-24T22:00:00Z",
  "version": "1.0.0",
  "scheduler": {
    "active_jobs": 25,
    "running": true
  },
  "database": {
    "connected": true,
    "pool_total": 20,
    "pool_idle": 15
  }
}
```

**Metrics to Track**:
- Automation execution success rate
- AI generation latency (p50, p95, p99)
- API endpoint response times
- Scheduler job count
- Database connection pool usage

---

## 9. Error Handling and Recovery

### 9.1 Error Handling Patterns

**Global Error Handler**:
```javascript
// src/middleware/errorHandler.js
export default (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

**Graceful Degradation**:
- AI service down → Return error, don't crash server
- Email service down → Log error, mark execution as failed
- Database read failure → Retry 3 times with exponential backoff

### 9.2 Retry Strategies

**Transient Failures**:
```javascript
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
}

// Usage
await withRetry(() => fetchStockPrice('AAPL'));
```

---

## 10. Testing Strategy

### 10.1 Unit Tests (Planned)
- **Models**: CRUD operations
- **Step Handlers**: Individual step logic
- **Utilities**: Helper functions, validators

### 10.2 Integration Tests (Planned)
- **API Endpoints**: Full request/response cycle
- **Workflow Execution**: Multi-step automation end-to-end
- **Scheduler**: Cron job triggering

### 10.3 Manual Testing Checklist
1. Register new user → Verify JWT token received
2. Create automation via AI → Verify workflow JSON generated
3. Start automation → Verify scheduled in cron
4. Wait for scheduled run → Verify execution recorded, email received
5. Manual test run → Verify immediate execution, results displayed
6. Stop automation → Verify unscheduled, no further runs
7. Delete automation → Verify cascade delete of executions

---

## 11. Future Enhancements

### 11.1 Version 2.0 (MCP Integration)
- ✅ Full MCP server implementation
- ✅ User context resources
- ✅ Data source validation tools
- ✅ AI-powered automation suggestions

### 11.2 Version 3.0 (Advanced Features)
- [ ] **Workflow Branching**: Conditional steps (if-else logic)
- [ ] **Parallel Execution**: Run multiple steps concurrently
- [ ] **Webhooks**: Trigger automations via HTTP POST
- [ ] **API Rate Limiting**: Per-user request limits
- [ ] **Analytics Dashboard**: Execution trends, performance charts
- [ ] **Collaboration**: Share automations with team members
- [ ] **Custom Integrations**: Plugin system for proprietary APIs

### 11.3 Enterprise Features
- [ ] **SSO**: Google Workspace, Microsoft Azure AD
- [ ] **RBAC**: Role-based access control
- [ ] **Audit Logs**: Compliance tracking
- [ ] **SLA**: 99.9% uptime guarantee
- [ ] **Dedicated Support**: 24/7 technical assistance

---

## 12. Conclusion

Smart Workflow Automation is architected for:
- **Scalability**: Stateless, horizontally scalable design
- **Reliability**: Comprehensive error handling, fallback strategies
- **Maintainability**: Clear separation of concerns, modular architecture
- **Extensibility**: Adapter pattern, step registry for easy expansion

With the planned integration of **Model Context Protocol**, the platform will evolve into a truly intelligent automation assistant that understands user context, validates data sources in real-time, and provides personalized suggestions—making it the **ultimate workflow automation tool for developers, traders, content creators, and researchers**.


