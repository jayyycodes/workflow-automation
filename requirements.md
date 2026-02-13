# Requirements Document
## Smart Workflow Automation - AI for Bharat Hackathon

---

## 1. Executive Summary

### 1.1 Project Overview
**Smart Workflow Automation** is an AI-first automation platform that transforms plain English instructions into production-ready workflows. Built for the AI for Bharat Hackathon, it eliminates the need for manual coding, templates, or complex setup by understanding user intent and automatically generating structured, executable workflow definitions with scheduling and integrations.

### 1.2 Problem Statement
- Building automations requires **deep technical expertise** including cron jobs, APIs, webhooks, and scripting
- Existing no-code tools rely on **rigid, template-based workflows** that limit flexibility
- Automation logic is often **fragmented across scripts**, making systems brittle and hard to scale
- Even simple use cases demand **significant setup time and maintenance effort**

### 1.3 Solution Approach
An AI-powered platform powered by **Google Gemini AI** that:
- Converts natural language instructions into structured workflow JSON
- Eliminates manual coding through semantic intent understanding
- Automatically generates production-ready workflows with scheduling and integrations
- Provides a unified, scalable system for real-time data processing and notifications

---

## 2. Functional Requirements

### 2.1 User Management

#### FR-1: User Registration
- **Description**: Users can create an account with email and password
- **Priority**: High
- **Acceptance Criteria**:
  - User provides email, password, and name
  - System validates email uniqueness
  - Password is securely hashed using bcrypt
  - User receives JWT token upon successful registration
  - WhatsApp number can be optionally provided for notifications

#### FR-2: User Authentication
- **Description**: Secure login and session management
- **Priority**: High
- **Acceptance Criteria**:
  - Users log in with email and password
  - System verifies credentials and issues JWT token
  - Token expires after configurable duration
  - Protected endpoints require valid JWT token

#### FR-3: User Profile Management
- **Description**: Users can update their profile information
- **Priority**: Medium
- **Acceptance Criteria**:
  - Users can add/update WhatsApp number for notifications
  - Profile changes are persisted to database
  - User can view their profile information

### 2.2 AI-Powered Automation Generation

#### FR-4: Natural Language Input
- **Description**: Users describe automations in plain English
- **Priority**: High
- **Acceptance Criteria**:
  - System accepts natural language text input
  - No special syntax or templates required
  - Supports various phrasings and colloquialisms
  
**Examples**:
- "Email me top HackerNews stories every morning"
- "Send me AAPL stock price updates every 5 minutes"
- "Notify me about weather in Mumbai daily at 8 AM"

#### FR-5: Intent Recognition
- **Description**: AI extracts automation intent from user input
- **Priority**: High
- **Acceptance Criteria**:
  - Google Gemini AI (gemini-1.5-flash) processes natural language
  - System identifies automation type (data fetch, notification, monitoring)
  - Extracts entities: data source, schedule, notification channel
  - OpenRouter fallback if Gemini is unavailable

#### FR-6: Multi-Turn Clarification
- **Description**: AI asks clarification questions for incomplete requests
- **Priority**: Medium
- **Acceptance Criteria**:
  - System detects missing required fields
  - Asks ONE question at a time to avoid overwhelming user
  - Maintains conversation context across turns
  - Generates final automation when all fields are complete
  - Supports both text and voice input modes

#### FR-7: Workflow JSON Generation
- **Description**: AI generates structured, executable workflow definitions
- **Priority**: High
- **Acceptance Criteria**:
  - Output is valid JSON with `name`, `trigger`, and `steps` fields
  - Trigger specifies scheduling (interval, cron expression)
  - Steps are ordered, executable actions with type and parameters
  - Context-aware entity extraction (stock symbols, Reddit subreddits, etc.)
  - Schema validation ensures JSON correctness

**Example Output**:
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

### 2.3 Automation Management

#### FR-8: Create Automation
- **Description**: Users can save generated automations
- **Priority**: High
- **Acceptance Criteria**:
  - Automation is persisted to PostgreSQL database
  - Initial status is DRAFT
  - Automation linked to user account
  - Unique automation ID generated

#### FR-9: List Automations
- **Description**: Users can view all their automations
- **Priority**: High
- **Acceptance Criteria**:
  - Dashboard displays all user automations
  - Shows name, status, trigger schedule, creation date
  - Sorted by creation date (newest first)
  - Displays last execution time and status

#### FR-10: Start/Stop Automation
- **Description**: Users can activate or pause automations
- **Priority**: High
- **Acceptance Criteria**:
  - START: Changes status to ACTIVE, schedules with node-cron
  - STOP: Changes status to PAUSED, unscheduled from cron
  - Only ACTIVE automations execute on schedule
  - Status persists across server restarts

#### FR-11: Manual Test Run
- **Description**: Users can manually trigger automation execution
- **Priority**: Medium
- **Acceptance Criteria**:
  - "Test Run" button executes automation immediately
  - Does not affect schedule status
  - Returns execution results in real-time
  - Useful for debugging and validation

#### FR-12: Delete Automation
- **Description**: Users can permanently remove automations
- **Priority**: Medium
- **Acceptance Criteria**:
  - Cascade delete removes all execution history
  - Unschedules from cron if ACTIVE
  - Confirmation required to prevent accidental deletion

### 2.4 Workflow Execution

#### FR-13: Sequential Step Execution
- **Description**: Execute workflow steps in order
- **Priority**: High
- **Acceptance Criteria**:
  - Steps execute sequentially, not in parallel
  - Each step receives context from previous steps
  - Step output stored in context for downstream use
  - Execution halts on first step failure

#### FR-14: Step Registry
- **Description**: Modular, extensible step handlers
- **Priority**: High
- **Acceptance Criteria**:
  - Each step type has dedicated handler function
  - Centralized registry maps step types to handlers
  - Easy to add new step types without core changes
  - Unsupported step types return clear error

**Supported Step Types**:
- `fetch_stock_price`: Yahoo Finance integration
- `fetch_weather`: OpenWeatherMap integration
- `scrape_hackernews`: HackerNews API adapter
- `scrape_github`: GitHub API adapter
- `scrape_reddit`: Reddit scraper (planned)
- `format_web_digest`: HTML email formatter
- `send_email`: SendGrid email delivery
- `send_sms`: Twilio SMS delivery
- `send_whatsapp`: Twilio WhatsApp delivery

#### FR-15: Execution Tracking
- **Description**: Record execution lifecycle and results
- **Priority**: High
- **Acceptance Criteria**:
  - New execution record created with PENDING status
  - Status transitions: PENDING → RUNNING → SUCCESS/FAILED
  - Stores step-by-step results and outputs
  - Records errors with stack traces for debugging
  - Tracks execution duration for performance monitoring
  - Timestamps for start and completion

#### FR-16: Execution History
- **Description**: Users can view past execution results
- **Priority**: Medium
- **Acceptance Criteria**:
  - "View Results" button shows execution modal
  - Displays all steps with inputs, outputs, and status
  - Shows execution duration and timestamps
  - Highlights failed steps with error messages
  - Supports viewing results from both manual and scheduled runs

### 2.5 Scheduling

#### FR-17: Cron-Based Scheduling
- **Description**: Automations run on defined schedules
- **Priority**: High
- **Acceptance Criteria**:
  - Uses node-cron for reliable scheduling
  - Supports interval syntax: `5m`, `1h`, `1d`, `1w`
  - Supports cron expressions: `0 9 * * *` (9 AM daily)
  - Schedules load on server startup
  - Persistent across server restarts (reload from DB)

#### FR-18: Scheduler Management
- **Description**: Dynamic schedule updates without restart
- **Priority**: Medium
- **Acceptance Criteria**:
  - Starting automation dynamically adds to scheduler
  - Stopping automation removes from scheduler
  - No server restart required for schedule changes
  - Health endpoint shows active scheduled jobs count

### 2.6 Data Integrations

#### FR-19: Stock Price Fetching
- **Description**: Real-time stock data via Yahoo Finance
- **Priority**: High
- **Acceptance Criteria**:
  - Supports any valid stock symbol (AAPL, TSLA, SBIN.NS)
  - Returns current price, change, and percentage change
  - Error handling for invalid symbols
  - Rate limiting compliance

#### FR-20: Weather Data
- **Description**: Weather information via OpenWeatherMap
- **Priority**: Medium
- **Acceptance Criteria**:
  - Supports city name or coordinates
  - Returns temperature, conditions, humidity
  - Handles API errors gracefully
  - Requires OPENWEATHER_API_KEY

#### FR-21: Web Scraping (Adapter Pattern)
- **Description**: Production-grade web scraping architecture
- **Priority**: High
- **Acceptance Criteria**:
  - Adapter pattern for easy extensibility
  - Each source has dedicated adapter (GitHub, HackerNews)
  - Standardized interface: `fetch()` and `formatDigest()`
  - Centralized orchestration via `webScraperService`
  - Easy to add new adapters (Twitter, Reddit) in 3 steps

**HackerNews Adapter**:
- Fetches top, new, or best stories
- Configurable count (1-30 stories)
- Keyword filtering support
- Returns title, URL, points, author, time

**GitHub Adapter**:
- Fetches user repositories or starred repos
- Returns repo name, description, stars, language
- Requires GITHUB_TOKEN for higher rate limits
- Supports organization repos

### 2.7 Notification Channels

#### FR-22: Email Notifications
- **Description**: Rich HTML email delivery via SendGrid
- **Priority**: High
- **Acceptance Criteria**:
  - Sends to logged-in user's email by default
  - Supports custom subject and body
  - Rich HTML formatting for web digests
  - Includes automation name and execution timestamp
  - Requires SENDGRID_API_KEY

#### FR-23: SMS Notifications
- **Description**: SMS delivery via Twilio
- **Priority**: Medium
- **Acceptance Criteria**:
  - Sends to user's phone number (from profile)
  - Character limit warnings
  - Plain text formatting
  - Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

#### FR-24: WhatsApp Notifications
- **Description**: WhatsApp messaging via Twilio
- **Priority**: Low
- **Acceptance Criteria**:
  - Sends to user's WhatsApp number (from profile)
  - Rich text formatting support
  - Requires Twilio WhatsApp sandbox setup

### 2.8 Frontend Dashboard

#### FR-25: Landing Page
- **Description**: Hacker/terminal-themed landing page
- **Priority**: High
- **Acceptance Criteria**:
  - Showcases problem statement and solution
  - Highlights key features with terminal aesthetics
  - Responsive design for mobile and desktop
  - Links to GitHub, demo video, live app

#### FR-26: Authentication Pages
- **Description**: Login and registration interfaces
- **Priority**: High
- **Acceptance Criteria**:
  - Dark theme terminal aesthetics
  - Form validation with error messages
  - JWT token storage in localStorage
  - Redirect to dashboard on success

#### FR-27: Automation Dashboard
- **Description**: Main interface for managing automations
- **Priority**: High
- **Acceptance Criteria**:
  - Lists all user automations with status
  - "Create Automation" button opens input modal
  - Start/Stop toggle buttons for each automation
  - "Test Run" and "View Results" buttons
  - Real-time execution status updates
  - Terminal-inspired design with Framer Motion animations

#### FR-28: Automation Creation Flow
- **Description**: User-friendly automation builder
- **Priority**: High
- **Acceptance Criteria**:
  - Text area for natural language input
  - "Generate Automation" button calls AI service
  - Shows generated workflow JSON for review
  - "Save Automation" button persists to database
  - Loading states and error handling

---

## 3. Non-Functional Requirements

### 3.1 Performance

#### NFR-1: Response Time
- AI workflow generation: < 3 seconds for 95% of requests
- Dashboard page load: < 2 seconds
- Manual automation execution: < 5 seconds for simple workflows
- API endpoint response: < 500ms for non-AI endpoints

#### NFR-2: Scalability
- Support 100+ concurrent users
- Handle 1000+ automations per user
- Graceful degradation under high load
- Database connection pooling

#### NFR-3: Throughput
- Process 50+ automation executions per minute
- Handle 10+ simultaneous AI generation requests

### 3.2 Security

#### NFR-4: Authentication
- JWT-based stateless authentication
- Secure password hashing with bcrypt (10 salt rounds)
- Token expiration (24 hours default)

#### NFR-5: Authorization
- Users can only access their own automations
- Protected API endpoints require valid JWT
- Middleware validates user ownership

#### NFR-6: Data Protection
- Environment variables for all secrets
- No API keys or credentials in code
- HTTPS enforcement in production
- CORS policy restricts cross-origin requests

#### NFR-7: Input Validation
- Sanitize all user inputs to prevent injection
- Validate workflow JSON schema before execution
- Rate limiting to prevent abuse

### 3.3 Reliability

#### NFR-8: Availability
- Target 99% uptime for production deployment
- Health check endpoint for monitoring
- Graceful startup and shutdown

#### NFR-9: Error Handling
- Comprehensive try-catch blocks
- Detailed error logging with context
- User-friendly error messages
- Automatic retry for transient failures (planned)

#### NFR-10: Data Persistence
- PostgreSQL for durable data storage
- Database connection retry logic
- Transaction support for critical operations

### 3.4 Maintainability

#### NFR-11: Code Quality
- ES6 modules for clean imports
- Consistent naming conventions
- Separation of concerns (routes, controllers, models, services)
- JSDoc comments for public APIs

#### NFR-12: Logging
- Structured logging with Winston
- Log levels: error, warn, info, debug
- Context-rich logs (user ID, automation ID, execution ID)
- Production log aggregation compatibility

#### NFR-13: Documentation
- README with setup instructions
- API endpoint documentation
- Architecture diagrams
- Example automation prompts

### 3.5 Usability

#### NFR-14: User Interface
- Intuitive, terminal-inspired design
- Fully responsive (mobile, tablet, desktop)
- Real-time feedback on actions
- Clear status indicators

#### NFR-15: Natural Language Flexibility
- Supports various phrasings for same intent
- No rigid syntax requirements
- Clarification flow for ambiguous requests

### 3.6 Deployment

#### NFR-16: Production Deployment
- Deployed on Render (live at workflow-automation-green.vercel.app)
- Frontend on Vercel
- Environment-specific configurations
- Database on managed PostgreSQL

#### NFR-17: Development Environment
- Local development setup in < 10 minutes
- Docker support (planned)
- Hot reload for rapid iteration

---

## 4. User Stories

### 4.1 As a Developer
- **US-1**: I want to automate HackerNews digest emails so I don't manually check the site every day
- **US-2**: I want to receive stock price alerts when AAPL drops below $150 so I can buy at the right time
- **US-3**: I want to monitor r/programming for AI-related posts so I stay updated on trends

### 4.2 As a Trader
- **US-4**: I want real-time stock price updates via SMS so I can make quick trading decisions
- **US-5**: I want to track multiple stock symbols and receive alerts when they cross thresholds

### 4.3 As a Content Creator
- **US-6**: I want to receive Reddit post digests from multiple subreddits via email
- **US-7**: I want to track GitHub trending repos weekly to discover popular projects

### 4.4 As a Researcher
- **US-8**: I want to scrape HackerNews for specific keywords (e.g., "DeepSeek") and receive hourly digests
- **US-9**: I want to combine multiple data sources (Reddit + HackerNews) into a single digest

---

## 5. Technical Requirements

### 5.1 Frontend Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **HTTP Client**: Fetch API
- **State Management**: React hooks

### 5.2 Backend Stack (Node.js)
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL 15+
- **ORM**: Raw SQL with pg library
- **Scheduler**: node-cron 3.x
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs

### 5.3 Backend Stack (Python AI)
- **Runtime**: Python 3.9+
- **Framework**: FastAPI
- **AI Provider**: Google Gemini API (gemini-1.5-flash)
- **Fallback AI**: OpenRouter API
- **HTTP Client**: httpx

### 5.4 Integrations
- **Email**: SendGrid API
- **SMS**: Twilio API
- **WhatsApp**: Twilio API
- **Stock Data**: Yahoo Finance (via yfinance or HTTP)
- **Weather**: OpenWeatherMap API
- **Web Scraping**: HackerNews API, GitHub API

### 5.5 Development Tools
- **Version Control**: Git, GitHub
- **Package Manager**: npm (Node.js), pip (Python)
- **Linting**: ESLint (planned)
- **Testing**: Jest (planned), Pytest (planned)

### 5.6 Environment Variables
Required for production deployment:

**Node.js Backend**:
```
DATABASE_URL=postgresql://user:password@host:5432/workflow_db
JWT_SECRET=your-super-secret-jwt-key
SENDGRID_API_KEY=SG.xxx
GITHUB_TOKEN=ghp_xxx (optional, for higher rate limits)
OPENWEATHER_API_KEY=xxx (optional)
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxx
AI_SERVICE_URL=http://localhost:8000 (or deployed Python service)
```

**Python AI Service**:
```
GEMINI_API_KEY=AIzaSyxxx
OPENROUTER_API_KEY=sk-or-xxx (optional fallback)
```

**Frontend**:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 6. Integration with Model Context Protocol (MCP)

### 6.1 What is MCP?
**Model Context Protocol** (MCP) is an open protocol developed by Anthropic for standardized communication between AI assistants and external data sources. It enables AI models to securely access context from various systems (databases, APIs, file systems) through a unified interface.

### 6.2 Benefits for This Project

#### Enhanced AI Capabilities
- **Real-time Context**: AI can access live data (stock prices, weather, user profiles) during workflow generation
- **Personalization**: AI can reference user's past automations to suggest similar workflows
- **Validation**: AI can verify data source availability before generating workflow

#### Better User Experience
- **Smarter Suggestions**: "Based on your previous HackerNews automation, would you like a similar one for Reddit?"
- **Auto-Fill**: AI can pre-populate common fields (user email, WhatsApp number) from profile
- **Error Prevention**: AI can warn if stock symbol doesn't exist before creating automation

#### Architecture Improvements
- **Unified Access**: Single protocol for AI to access all backend services (DB, APIs, integrations)
- **Security**: Centralized permission model for what AI can access
- **Extensibility**: Easy to add new data sources without modifying core AI service

### 6.3 Proposed MCP Integration

#### Phase 1: MCP Server Implementation
Create MCP server exposing:
- **User Context**: Profile data, automation history, preferences
- **Data Sources**: Available integrations (stocks, weather, web scrapers)
- **Validation Tools**: Check if API keys configured, data source reachable

#### Phase 2: AI Service Integration
Update Python AI service to:
- Query MCP server during workflow generation
- Access user context for personalized suggestions
- Validate data sources before generating JSON

#### Phase 3: Enhanced Features
- **Workflow Templates**: AI suggests templates based on user's domain (trader, developer, researcher)
- **Smart Defaults**: Auto-populate notification channels from user profile
- **Conflict Detection**: Warn if creating duplicate automation

### 6.4 Example MCP Use Case

**User Input**: "Send me stock updates"

**Without MCP**:
- AI asks: "Which stock?"
- AI asks: "How often?"
- AI asks: "Via email or SMS?"

**With MCP**:
- AI queries MCP: User has previous stock automations for AAPL, TSLA
- AI queries MCP: User prefers email notifications
- AI suggests: "I see you track AAPL and TSLA. Would you like updates for those, or a different stock? I'll send via email like your other automations."

**Result**: Fewer clarification turns, faster automation creation, better UX.

---

## 7. Constraints and Assumptions

### 7.1 Constraints
- AI generation limited by Google Gemini rate limits (15 RPM free tier)
- Email sending limited by SendGrid free tier (100 emails/day)
- SMS limited by Twilio credit balance
- Web scraping subject to API rate limits (GitHub, HackerNews)

### 7.2 Assumptions
- Users have basic understanding of automation concepts
- Users have valid email addresses for notifications
- Third-party APIs (Gemini, SendGrid, Twilio) remain operational
- PostgreSQL database is available and properly configured

---

## 8. Success Metrics

### 8.1 Functional Metrics
- ✅ Successfully generate workflows for 90%+ of natural language inputs
- ✅ Execute automations with < 5% failure rate (excluding external API failures)
- ✅ Support at least 5 data sources and 3 notification channels

### 8.2 User Experience Metrics
- ✅ Average automation creation time < 60 seconds
- ✅ Zero-code automation creation (no manual JSON editing)
- ✅ < 2 clarification questions per automation on average

### 8.3 Technical Metrics
- ✅ 99%+ uptime for production deployment
- ✅ < 3 second AI generation latency
- ✅ Support 100+ concurrent automations

---

## 9. Future Enhancements

### 9.1 Version 2.0 Features
- [ ] **MCP Integration**: Full Model Context Protocol support
- [ ] **Additional Data Sources**: Twitter/X, Reddit, YouTube, LinkedIn
- [ ] **Advanced Scheduling**: Conditional triggers (if stock > X), webhooks
- [ ] **Workflow Branching**: If-else logic, parallel steps
- [ ] **Collaboration**: Share automations with team members
- [ ] **Analytics Dashboard**: Execution stats, performance charts

### 9.2 Enterprise Features
- [ ] **SSO Integration**: Google, Microsoft, Okta
- [ ] **Team Workspaces**: Multi-user organizations
- [ ] **Audit Logs**: Compliance and security tracking
- [ ] **Custom Integrations**: Plugin system for proprietary APIs
- [ ] **SLA Guarantees**: 99.9% uptime, dedicated support

---

## 10. Conclusion

Smart Workflow Automation represents a paradigm shift in automation creation, making powerful workflow capabilities accessible to non-technical users through natural language. By integrating Model Context Protocol in Version 2.0, the platform will become even more intelligent, personalized, and user-friendly, cementing its position as the ultimate AI-powered automation tool for the Indian market and beyond.

**This is the future of automation: Just describe it, and it happens. ⚡**
