# 🟢 Smart Workflow Automation Platform

> **AI-Powered Automation Engine with Terminal-Style Interface**

A full-stack workflow automation platform that converts natural language descriptions into executable automations. Built with Node.js, Next.js, PostgreSQL, and Python AI services.

## ✨ Features

### 🤖 AI-Powered Automation Generation
- **Natural Language Processing**: Describe workflows in plain English
- **Intelligent Step Extraction**: AI identifies required steps and data sources
- **Visual Workflow Preview**: See generated automation before saving
- **Context-Aware**: Understands stock prices, notifications, scheduling, and more

### 🎨 Terminal-Style UI
- **Matrix/Hacker Aesthetic**: Dark green monospace terminal theme
- **Scanline Effects**: Authentic CRT monitor feel
- **Terminal Commands**: Interface styled like a command-line terminal
- **Responsive Design**: Works on desktop and mobile

### 🔄 Automation Management
- **Real-time Execution**: Run automations manually or on schedule
- **Status Tracking**: Active, Paused, or Draft states
- **Execution History**: View detailed results and logs
- **Immediate First Run**: Automations execute immediately when activated

### 📱 Multi-Channel Notifications
- **Email**: SMTP integration for email notifications
- **WhatsApp**: Twilio WhatsApp sandbox support
- **SMS**: Twilio SMS notifications with international phone support
- **Smart Routing**: Automatically uses available channels

### 🔐 Security & Authentication
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt for password security
- **Email Validation**: Prevents fake email addresses
- **Phone Verification**: International format validation
- **Protected Routes**: Role-based access control

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **PostgreSQL** 14+
- **Python** 3.9+ (for AI service)
- **Twilio Account** (for notifications)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd workflow-automation

# Install backend dependencies
npm install

# Install frontend dependencies
cd Frontend/my-app
npm install
cd ../..

# Install Python dependencies
cd engine-py
pip install -r requirements.txt
cd ..
```

### Environment Configuration

1. **Backend (`./env`):**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=workflow_automation
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key-min-32-chars

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Twilio (Notifications)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# External APIs
STOCK_API_KEY=your_alpha_vantage_key
```

2. **Frontend (`Frontend/my-app/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

3. **Python AI Service (`engine-py/.env`):**
```env
GROQ_API_KEY=your_groq_api_key
```

### Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE workflow_automation;"

# Initialize tables
npm run db:init
```

### Running the Application

```bash
# Terminal 1 - Backend Server
npm run dev
# Runs on http://localhost:3000

# Terminal 2 - Frontend
cd Frontend/my-app
npm run dev
# Runs on http://localhost:3001

# Terminal 3 - Python AI Service
cd engine-py
uvicorn app:app --reload --port 8000
# Runs on http://localhost:8000
```

---

## 📁 Project Structure

```
workflow-automation/
├── src/                          # Backend (Node.js/Express)
│   ├── index.js                  # Express app entry
│   ├── config/
│   │   └── db.js                 # PostgreSQL connection
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   └── automationController.js
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js               # User model (with phone fields)
│   │   ├── Automation.js
│   │   └── Execution.js
│   ├── routes/
│   │   ├── auth.js               # /auth/register, /auth/login, /auth/me
│   │   ├── automations.js
│   │   └── user.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── emailService.js
│   │   └── twilioService.js
│   ├── automations/
│   │   ├── stepRegistry.js       # Step implementations
│   │   └── workflowExecutor.js   # Execution engine
│   ├── scheduler/
│   │   └── scheduler.js          # Cron-based scheduling
│   ├── integrations/
│   │   └── stockApiService.js    # Stock price API
│   └── scripts/
│       ├── initDb.js             # Database initialization
│       ├── checkUsers.js
│       └── deleteAllUsers.js
│
├── Frontend/my-app/              # Frontend (Next.js 15)
│   ├── app/
│   │   ├── page.js               # Landing page (terminal theme)
│   │   ├── login/page.js         # Login page
│   │   ├── register/page.js      # Registration page
│   │   ├── dashboard/
│   │   │   ├── layout.js         # Dashboard sidebar layout
│   │   │   ├── page.js           # Automation list
│   │   │   └── create/page.js    # AI automation creator
│   │   └── globals.css           # Global styles (terminal theme)
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   └── features/
│   │       └── automation-card.js # Automation card component
│   ├── providers/
│   │   └── auth-provider.js      # Auth context
│   └── lib/
│       └── api.js                # API client
│
└── engine-py/                    # Python AI Service
    ├── app.py                    # FastAPI server
    ├── prompts.py                # LLM prompts for workflow generation
    └── requirements.txt
```

---

## � API Documentation

### Authentication

#### `POST /auth/register`
Register a new user with email validation and required phone number.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123",
  "whatsappNumber": "+919876543210"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe"
  },
  "token": "eyJhbGc..."
}
```

#### `POST /auth/login`
Login with email and password.

#### `GET /auth/me`
Get current authenticated user (requires Bearer token).

### Automations

#### `POST /automations`
Create a new automation.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "Daily Stock Alert",
  "description": "Send SBIN stock price via SMS daily at 9 AM",
  "trigger": {
    "type": "interval",
    "config": { "every": "1d" }
  },
  "steps": [
    {
      "type": "fetch_stock_price",
      "symbol": "SBIN.NS"
    },
    {
      "type": "send_sms",
      "message": "SBIN Price: {{price}}"
    }
  ],
  "status": "draft"
}
```

#### `GET /automations`
List all user automations.

#### `GET /automations/:id`
Get automation by ID.

#### `POST /automations/:id/run`
Manually trigger automation execution.

#### `PATCH /automations/:id/status`
Update automation status (active/paused).

**Request:**
```json
{
  "status": "active"
}
```

#### `GET /automations/:id/executions`
Get execution history for an automation.

### AI Generation

#### `POST /generate`
Generate automation from natural language (Python service).

**Request:**
```json
{
  "description": "Send me AAPL stock price via email every morning at 9 AM"
}
```

**Response:**
```json
{
  "automation": {
    "name": "AAPL Stock Price Email",
    "description": "Send AAPL stock price via email at 9 AM daily",
    "trigger": {
      "type": "interval",
      "config": { "every": "1d" }
    },
    "steps": [
      {
        "type": "fetch_stock_price",
        "symbol": "AAPL",
        "description": "Fetch current AAPL stock price"
      },
      {
        "type": "send_email",
        "subject": "AAPL Stock Price Update",
        "body": "Current AAPL price: {{price}}",
        "description": "Send email with stock price"
      }
    ]
  }
}
```

---

## 🎯 Supported Automation Steps

### Data Fetching
- **`fetch_stock_price`**: Get real-time stock prices (Alpha Vantage)
  - `symbol`: Stock ticker (e.g., "AAPL", "SBIN.NS")

### Notifications
- **`send_email`**: Send email via SMTP
  - `to`, `subject`, `body`
- **`send_whatsapp`**: Send WhatsApp message via Twilio
  - `to`, `message`
- **`send_sms`**: Send SMS via Twilio
  - `to`, `message`
- **`notify`**: Smart routing (auto-selects best channel)
  - `message`, `channel` (optional)

### Triggers
- **`interval`**: Run on schedule
  - Config: `{ "every": "5m" | "1h" | "1d" }`
- **`manual`**: Run on-demand only

---

## 🎨 Terminal Theme

The entire UI uses a **Matrix/Hacker terminal aesthetic**:

### Design Elements
- **Color Palette**: Dark green (#22c55e, #16a34a, #15803d) on black
- **Typography**: Monospace fonts throughout (`font-mono`)
- **Effects**: Scanline CRT overlay, green glows, terminal borders
- **Commands**: Terminal-style prompts (`>`, `$`, `//`)

### Pages
- **Landing**: Terminal-style hero with command prompts
- **Login/Register**: `user.login()`, `create_account()`
- **Dashboard**: `> automations.list()`, sidebar with terminal nav
- **Create**: `> automation.create()` with AI generation

---

## � Security Features

1. **Authentication**
   - JWT tokens with secure secrets
   - bcrypt password hashing (10 rounds)
   - Token expiration (24 hours)

2. **Validation**
   - Email format and fake domain detection
   - International phone number validation
   - Required fields enforcement
   - SQL injection prevention (parameterized queries)

3. **Authorization**
   - User ownership verification on all resources
   - Protected API routes
   - No sensitive data in client responses

---

## 📊 Database Schema

### Users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone_number VARCHAR(20),
    whatsapp_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Automations
```sql
CREATE TABLE automations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger JSONB NOT NULL,
    steps JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Executions
```sql
CREATE TABLE executions (
    id SERIAL PRIMARY KEY,
    automation_id INTEGER REFERENCES automations(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    steps_data JSONB,
    error TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

---

## 🧪 Testing

### Manual Testing

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "whatsappNumber": "+919876543210"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Create automation (use token from login)
curl -X POST http://localhost:3000/automations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Automation",
    "description": "Test description",
    "trigger": {"type": "manual"},
    "steps": [{"type": "send_email", "subject": "Test"}],
    "status": "draft"
  }'
```

---

## �️ Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check PostgreSQL is running
   - Verify credentials in `.env`
   - Ensure database exists

2. **Twilio errors**
   - Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
   - Check `TWILIO_PHONE_NUMBER` format (+1234567890)
   - For WhatsApp: Join sandbox first

3. **AI generation not working**
   - Check Python service is running (port 8000)
   - Verify `GROQ_API_KEY` is set
   - Check `NEXT_PUBLIC_API_URL` in frontend

4. **Frontend not connecting**
   - Check `NEXT_PUBLIC_API_URL` matches backend URL
   - Verify CORS is enabled
   - Check browser console for errors

---

## 📝 Scripts

```bash
# Database
npm run db:init          # Initialize database tables
npm run migrate:phone    # Add phone number columns
npm run check:users      # Display all users

# Development
npm run dev             # Start backend server
npm run frontend        # Start frontend (in Frontend/my-app)

# User Management
node src/scripts/deleteAllUsers.js  # Delete all users (CAUTION)
```

---

## 🎯 Roadmap

### Completed ✅
- [x] Natural language automation generation
- [x] Terminal-style UI theme
- [x] Email notifications (SMTP)
- [x] WhatsApp integration (Twilio)
- [x] SMS notifications (Twilio)
- [x] Stock price API integration
- [x] Cron-based scheduling
- [x] Execution history tracking
- [x] User authentication & authorization
- [x] Responsive mobile design

### Planned 🔮
- [ ] Voice input support
- [ ] Webhook triggers
- [ ] More data source integrations
- [ ] Automation templates library
- [ ] Team collaboration features
- [ ] Advanced scheduling (specific times)
- [ ] Conditional logic in workflows
- [ ] Custom code steps (JavaScript/Python)

---

## 📄 License

ISC

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using Node.js, Next.js, PostgreSQL, Python, and AI**
