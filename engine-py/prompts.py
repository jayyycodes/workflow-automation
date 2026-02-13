"""
LLM Prompts for Automation Generation (v2)

Key changes from v1:
- Dynamic tool injection from registry API
- Retry correction prompt for self-healing
- Stricter JSON enforcement
- All original prompts preserved for backward compatibility
"""

import json
import logging
import httpx
from config import ALLOWED_STEPS, ALLOWED_TRIGGERS

logger = logging.getLogger(__name__)

# ─── Registry Integration ────────────────────────────────────────────────

# Cache for registry data (fetched once at startup, refreshed on demand)
_registry_cache = {
    "tools": None,
    "prompt_text": None,
    "tool_names": None,
    "version": None
}

def fetch_registry(base_url: str = "http://localhost:3000") -> dict:
    """Fetch tool definitions from the Node.js registry endpoint."""
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(f"{base_url}/registry/prompt")
            response.raise_for_status()
            data = response.json()
            
            _registry_cache["prompt_text"] = data.get("promptText", "")
            _registry_cache["tool_names"] = data.get("toolNames", [])
            _registry_cache["version"] = data.get("registryVersion", "unknown")
            
            logger.info(f"✅ Registry loaded: {len(_registry_cache['tool_names'])} tools (v{_registry_cache['version']})")
            return data
    except Exception as e:
        logger.warning(f"⚠️ Could not fetch registry from {base_url}: {e}. Using hardcoded ALLOWED_STEPS.")
        return None

def get_tool_prompt_text() -> str:
    """Get tool descriptions for prompt injection. Uses registry if available, falls back to ALLOWED_STEPS."""
    if _registry_cache["prompt_text"]:
        return _registry_cache["prompt_text"]
    
    # Fallback to hardcoded list from config.py
    return "\n".join(f"- {step}" for step in ALLOWED_STEPS)

def get_allowed_tool_names() -> list:
    """Get list of allowed tool names. Uses registry if available."""
    if _registry_cache["tool_names"]:
        return _registry_cache["tool_names"]
    return ALLOWED_STEPS

# ─── System Prompts ──────────────────────────────────────────────────────

# System prompt for intent parsing (unchanged from v1)
PARSE_INTENT_PROMPT = f"""You are an intent parser for an automation system.

Extract the user's intent from their natural language request.

Return a JSON object with:
- "intent": one of ["stock_monitor", "crypto_monitor", "job_alert", "notification", "email_alert", "custom"]
- "entities": extracted values like symbol, interval, recipient, etc.
- "channel": notification channel ["notification", "email", "whatsapp", "sms"]

RULES:
- Output ONLY valid JSON
- No explanations, no markdown, no code blocks
- If unclear, use reasonable defaults
- Use interval format: <number><unit> (e.g., 1m, 5m, 30s, 1h, 2d)

Example input: "Send me AAPL stock price every 5 minutes"
Example output: {{"intent": "stock_monitor", "entities": {{"symbol": "AAPL", "interval": "5m"}}, "channel": "notification"}}
"""


def build_generation_prompt(user_request: str, tool_prompt_text: str = None) -> str:
    """
    Build the automation generation prompt with dynamic tool injection.
    This replaces the old static GENERATE_AUTOMATION_PROMPT.
    """
    if tool_prompt_text is None:
        tool_prompt_text = get_tool_prompt_text()
    
    return f"""You are an automation planner. Convert user instructions into a structured automation JSON.

CRITICAL RULES:
1. Output ONLY a valid JSON object — NO markdown, NO code blocks, NO explanations
2. Use ONLY the step types listed below — NEVER invent new ones
3. If unsure about a parameter value, use null instead of inventing values
4. Every automation MUST have at least one notification step

OUTPUT SCHEMA:
{{
  "name": "string",
  "description": "string",
  "trigger": {{
    "type": "manual|interval",
    "every": "interval string (only if type is interval)"
  }},
  "steps": [
    {{
      "type": "step_type_from_list_below",
      ...step-specific fields
    }}
  ]
}}

AVAILABLE TOOLS (from registry):
{tool_prompt_text}

ALLOWED TRIGGER TYPES:
{ALLOWED_TRIGGERS}

VALID INTERVAL FORMAT:
- Format: <number><unit> where unit = s (seconds), m (minutes), h (hours), d (days), w (weeks)
- Examples: 30s, 1m, 2m, 5m, 1h, 2d, 1w

STEP CONFIGURATIONS:
- fetch_stock_price: {{"type": "fetch_stock_price", "symbol": "AAPL"}}
- fetch_crypto_price: {{"type": "fetch_crypto_price", "symbol": "BTC"}}
- fetch_weather: {{"type": "fetch_weather", "location": "user's city name"}} **Always ask user for their city, never use "current"**
- scrape_github: {{"type": "scrape_github", "username": "github_user", "repo_type": "stars|repos|activity"}}
- scrape_hackernews: {{"type": "scrape_hackernews", "story_type": "top|best|new", "count": 10}}
- scrape_reddit: {{"type": "scrape_reddit", "subreddit": "programming", "sort": "hot", "limit": 10, "keyword": "AI"}}
- format_web_digest: {{"type": "format_web_digest", "provider": "github|hackernews|reddit"}}
- send_notification: {{"type": "send_notification", "message": "..."}}
- send_email: {{"type": "send_email", "to": "user@example.com", "subject": "...", "body": "..."}}
- send_whatsapp: {{"type": "send_whatsapp", "to": "+1234567890", "message": "..."}}
- send_sms: {{"type": "send_sms", "to": "+1234567890", "message": "..."}}
- scrape_screener: {{"type": "scrape_screener", "symbol": "HCLTECH"}}
- scrape_groww: {{"type": "scrape_groww", "url": "https://groww.in/gold-rates"}}
- scrape_hack2skill: {{"type": "scrape_hack2skill", "url": "https://hack2skill.com/", "limit": 5}}
- scrape_twitter: {{"type": "scrape_twitter", "username": "handle", "limit": 5}}
- send_discord: {{"type": "send_discord", "webhook_url": "...", "message": "..."}}
- send_slack: {{"type": "send_slack", "webhook_url": "...", "message": "..."}}

NOTIFICATION PLACEHOLDER VALUES:
- Email: "user@example.com" (backend auto-replaces with user's email)
- WhatsApp/SMS: "+1234567890" (backend auto-replaces with user's phone)

NOTIFICATION CHANNEL KEYWORDS:
- Email: "email", "mail" → use send_email
- WhatsApp: "whatsapp", "wa" → use send_whatsapp
- SMS: "sms", "text", "text me" → use send_sms
- Discord: "discord" → use send_discord
- Slack: "slack" → use send_slack
- Default (no channel specified): use send_email

WEB SCRAPING WORKFLOW PATTERN (ALWAYS 3 steps):
1. scrape_[provider] (github/hackernews/reddit/screener/groww/hack2skill/twitter)
2. format_web_digest (provider: matching provider name) **REQUIRED!**
3. send notification (email/sms/discord/slack)
Without format_web_digest, the notification body will be empty!

CONDITIONAL WORKFLOW PATTERN (ALWAYS 3 steps):
1. Fetch data step
2. {{"type": "condition", "if": "stockPrice < 150"}} (field is 'if', NOT 'condition')
3. Notification step (executor skips this if condition is false)

EXAMPLE 1 (Stock Email):
Input: "Send me AAPL stock price every 5 minutes"
Output:
{{
  "name": "AAPL Stock Price Monitor",
  "description": "Fetch AAPL stock price every 5 minutes and send email notification",
  "trigger": {{"type": "interval", "every": "5m"}},
  "steps": [
    {{"type": "fetch_stock_price", "symbol": "AAPL"}},
    {{"type": "send_email", "to": "user@example.com", "subject": "AAPL Stock Update", "body": "Current AAPL price"}}
  ]
}}

EXAMPLE 2 (HackerNews Digest):
Input: "Email me top HackerNews stories every morning"
Output:
{{
  "name": "HackerNews Daily Digest",
  "description": "Top HackerNews stories delivered daily",
  "trigger": {{"type": "interval", "every": "1d"}},
  "steps": [
    {{"type": "scrape_hackernews", "story_type": "top", "count": 10}},
    {{"type": "format_web_digest", "provider": "hackernews"}},
    {{"type": "send_email", "to": "user@example.com", "subject": "Top HackerNews Stories", "body": "Digest below"}}
  ]
}}

EXAMPLE 3 (Conditional SMS):
Input: "Track Apple stock and SMS me if it drops below $150"
Output:
{{
  "name": "Apple Stock Alert",
  "description": "SMS notification when AAPL drops below $150",
  "trigger": {{"type": "interval", "every": "5m"}},
  "steps": [
    {{"type": "fetch_stock_price", "symbol": "AAPL"}},
    {{"type": "condition", "if": "stockPrice < 150"}},
    {{"type": "send_sms", "to": "+1234567890", "message": "ALERT: AAPL dropped below $150!"}}
  ]
}}

User request: {user_request}
Output:"""


# Keep old prompt for backward compatibility
GENERATE_AUTOMATION_PROMPT = build_generation_prompt("{user_request_placeholder}")


# ─── Retry Correction Prompt ─────────────────────────────────────────────

RETRY_CORRECTION_PROMPT = """You are an automation planner. Your previous attempt to generate automation JSON failed.

PREVIOUS ERROR:
{error}

INVALID OUTPUT (what you generated):
{invalid_output}

ORIGINAL USER REQUEST:
{user_request}

FIX INSTRUCTIONS:
1. Analyze the error message above
2. Fix ONLY the specific issue mentioned in the error
3. Return a corrected JSON object
4. Output ONLY valid JSON — NO markdown, NO code blocks, NO explanations
5. Do NOT change parts of the JSON that were already correct

ALLOWED STEP TYPES: {allowed_steps}

Corrected JSON output:"""


# ─── Entity Extraction Prompt (unchanged from v1) ────────────────────────

ENTITY_EXTRACTION_PROMPT = f"""You are an entity extractor for an automation system.

Extract all information from the user's request into a structured format.

Return a JSON object with:
- "intent": one of ["stock_monitor", "crypto_monitor", "job_alert", "price_alert", "custom"]
- "entities": object containing extracted values

ENTITIES TO EXTRACT (include ONLY if present in the request):
- symbol: stock ticker or crypto symbol (e.g., "AAPL", "BTC", "SBIN")
- interval: time interval (format: <number><unit> like 1m, 2m, 30s, 1h, 2d)
- notification_channel: where to send updates (e.g., "whatsapp", "email", "notification")
- query: search query (for job alerts)
- condition: price condition (e.g., "above 150", "below 100")
- threshold: price threshold number

RULES:
- Output ONLY valid JSON - no explanations, no markdown
- Only include fields that are EXPLICITLY mentioned
- Do NOT guess or infer missing information
- If notification channel is mentioned (WhatsApp, email, etc.), include it
- If no channel is mentioned, do NOT include notification_channel

Examples:

Input: "Check SBIN stock every 5 minutes"
Output: {{"intent": "stock_monitor", "entities": {{"symbol": "SBIN", "interval": "5m"}}}}

Input: "WhatsApp me AAPL updates every hour"
Output: {{"intent": "stock_monitor", "entities": {{"symbol": "AAPL", "interval": "1h", "notification_channel": "whatsapp"}}}}

Input: "Send me Bitcoin price on email daily"
Output: {{"intent": "crypto_monitor", "entities": {{"symbol": "BTC", "interval": "1d", "notification_channel": "email"}}}}
"""


# ─── Twitter Research Prompt (unchanged from v1) ─────────────────────────

TWITTER_RESEARCH_PROMPT = """You are a social media researcher.
Your task is to provide a summary of the latest 5 tweets/posts from the specified Twitter handle.

Input: @{username}

Output Format (STRICT Markdown):
🐦 **Recent Insights from @{username}**
_(Source: AI Research - Live scraping currently restricted)_

📝 **Recent Update**
[Detailed summary of a recent tweet, statement, or activity by the user. Be specific about the topic, e.g., a recent interview, investment, or opinion.]
🔗 [View on Twitter](https://twitter.com/{username})

---

📝 **Recent Update**
[Summary of another recent activity...]
🔗 [View on Twitter](https://twitter.com/{username})

... (Total 5 updates)

---
_Note: This summary was generated using AI research to provide relevant context while direct live scraping is unavailable._

RULES:
- Be factual and specific based on your training data.
- Do NOT hallucinate specific dates if unsure; use "Recently" or "Recent Update".
- Focus on the most impactful recent activity (podcasts, business moves, public statements).
- Output ONLY the markdown content.
"""
