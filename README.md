# 🤖 Smart Workflow Automation

**Transform plain English into powerful automations with AI**

[![Powered by Google Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Live Demo](https://img.shields.io/badge/Live-Demo-00C853?style=for-the-badge)](https://your-render-url.onrender.com)

---

## ✨ What Is This?

Smart Workflow Automation lets you create complex automations using **plain English**. Powered by Google Gemini AI, it understands your intent and builds workflows automatically.

### Just say:
- _"Email me top HackerNews stories every morning"_ → ✅ Done
- _"Send me AAPL stock price updates every 5 minutes"_ → ✅ Done  
- _"Notify me about weather in Mumbai daily at 8 AM"_ → ✅ Done

No coding required. Just natural language.

---

## 🎯 Live Demo

![HackerNews Email](./docs/hackernews-email-demo.png)
*Actual email generated automatically - beautifully formatted HackerNews digest*

**Try it yourself:** [Live App](https://your-render-url.onrender.com)

---

## 🚀 Features

### 🤖 **AI-Powered Workflow Generation**
- **Google Gemini** as primary LLM (OpenRouter fallback)
- Natural language → JSON workflows
- Smart entity extraction
- Context-aware clarification

### 📊 **Real-Time Data Integrations**
- **Stock Prices**: Yahoo Finance
- **Weather**: OpenWeatherMap
- **Web Scraping**: HackerNews, GitHub
- **Notifications**: Email (SendGrid), SMS, WhatsApp

### ⚡ **Production-Ready Architecture**
- **Adapter Pattern** for web scraping (easily add Twitter, Reddit, etc.)
- **Cron Scheduling** for recurring automations
- **PostgreSQL** for data persistence
- **Deployed on Render** (live production app!)

### 🎨 **Beautiful Terminal UI**
- Hacker/terminal theme
- Responsive design
- Real-time execution status
- Framer Motion animations

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React
- TailwindCSS
- Framer Motion

**Backend (Node.js):**
- Express.js
- PostgreSQL
- Node-cron (scheduling)
- Axios (HTTP)

**Backend (Python AI):**
- FastAPI
- Google Gemini API
- OpenRouter API

**Integrations:**
- SendGrid (email)
- Yahoo Finance (stocks)
- OpenWeatherMap (weather)
- GitHub API
- HackerNews API

---

## 📸 Screenshots

### Dashboard
![Dashboard](./docs/dashboard.png)

### Automation Creation
![Create Automation](./docs/create-automation.png)

### Email Results
![Email Result](./docs/email-result.png)

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
git clone https://github.com/yourusername/workflow-automation.git
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

# 5. Start services
npm start              # Node.js backend (port 5000)
npm run dev:frontend   # Next.js frontend (port 3000)
npm run dev:ai         # Python AI service (port 8000)
```

### Environment Variables

```env
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/workflow_db
JWT_SECRET=your-secret-key
SENDGRID_API_KEY=your-sendgrid-key
GEMINI_API_KEY=your-gemini-key

# Optional
GITHUB_TOKEN=your-github-token (for higher rate limits)
OPENWEATHER_API_KEY=your-weather-key
OPENROUTER_API_KEY=your-openrouter-key (fallback LLM)
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

3. **Execution** (Workflow Engine):
   - Scrapes HackerNews API
   - Formats as beautiful digest
   - Sends via SendGrid

4. **Scheduling** (Node-cron):
   - Runs every day automatically
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

### GitHub Digest
```
"Email me [Your_github_username] GitHub stars summary every Monday"
```

### HackerNews Digest
```
"SMS me top 10 HackerNews stories every 5hrs"
```

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js UI    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐      ┌──────────────┐
│  Node.js API    │─────→│  PostgreSQL  │
└────────┬────────┘      └──────────────┘
         │
         ├──→ Scheduler (node-cron)
         │
         ├──→ Step Executors
         │    ├─ Stock Fetcher
         │    ├─ Weather Fetcher
         │    ├─ Web Scraper
         │    └─ Email Sender
         │
         └──→ Python AI Service
              └─ Google Gemini
```

---

## 🔥 Production Deployment

### Deploy to Render

**Prerequisites:**
- Render account
- GitHub repository

**Steps:**

1. **Push to GitHub**:
   ```bash
   git push origin main
   ```

2. **Create Render Services**:
   - **Node.js Backend**: 
     - Build: `npm install`  
     - Start: `npm start`
   - **Python AI**: 
     - Build: `pip install -r requirements.txt`
     - Start: `uvicorn app:app --host 0.0.0.0 --port 8000`
   - **Frontend**:
     - Build: `cd Frontend/my-app && npm install && npm run build`
     - Start: `npm start`

3. **Set Environment Variables** in Render dashboard

4. **Deploy** - Render auto-deploys on git push!

---

## 📦 Web Scraping Architecture

Production-grade adapter pattern for easy extensibility:

```javascript
src/integrations/web/
├── webScraperService.js       // Main orchestrator
├── adapters/
│   ├── githubAdapter.js       // GitHub API
│   ├── hackerNewsAdapter.js   // HackerNews API
│   └── twitterAdapter.js      // (Coming soon)
```

**Add new scraper in 3 steps:**
1. Create adapter file
2. Implement `fetch()` and `formatDigest()`
3. Register in `webScraperService.js`

---

## 🤝 Contributing

Contributions welcome! Areas to explore:
- [ ] Twitter/X integration
- [ ] Reddit scraper
- [ ] Slack notifications
- [ ] Discord webhooks
- [ ] Calendar integration (Google Calendar)

---

## 📄 License

MIT

---

## 🙏 Acknowledgments

- **Google Gemini** - Primary AI engine
- **OpenRouter** - Fallback LLM provider
- **SendGrid** - Reliable email delivery
- **Render** - Seamless deployment

---


<div align="center">

**⚡ Transform plain English into powerful automations ⚡**

[![Powered by Google Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)

</div>
