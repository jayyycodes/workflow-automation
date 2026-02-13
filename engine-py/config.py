"""
Configuration for the AI Engine (v2)

Environment variables, constants, and dynamic registry loading.
"""

import os
import re
import logging
from pathlib import Path
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load .env from the engine-py directory explicitly
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

# OpenRouter API Key (get free at https://openrouter.ai/keys)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

# Gemini API Key (primary LLM)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Model configuration
LLM_MODEL = os.getenv("LLM_MODEL", "meta-llama/llama-3.2-3b-instruct:free")

# Gemini model (primary)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

# Node.js backend URL (for registry sync)
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")

# Allowed steps registry (FALLBACK — prefer dynamic registry from Node.js)
# Updated to match all tools in toolDefinitions.json
ALLOWED_STEPS = [
    'fetch_weather',
    'fetch_stock_price', 
    'fetch_crypto_price',
    'fetch_data',
    'fetch_url',
    'scrape_github',
    'scrape_hackernews',
    'scrape_reddit',
    'scrape_screener',
    'scrape_groww',
    'scrape_hack2skill',
    'scrape_twitter',
    'format_web_digest',
    'send_email',
    'send_sms',
    'send_whatsapp',
    'send_notification',
    'send_discord',
    'send_slack',
    'notify',
    'job_search',
    'job_apply',
    'condition',
    'delay'
]

# Allowed trigger types
ALLOWED_TRIGGERS = [
    "manual",
    "interval",
    "webhook",
    "event"
]

# Valid interval pattern (flexible - allows any reasonable interval)
INTERVAL_PATTERN = re.compile(r'^(\d{1,3})(s|m|h|d|w)$')

def validate_interval_format(interval: str) -> bool:
    """
    Validate interval format without restricting to specific values.
    Accepts: 1s, 2m, 30m, 1h, 2d, etc.
    """
    if not isinstance(interval, str):
        return False
    return INTERVAL_PATTERN.match(interval.lower()) is not None

