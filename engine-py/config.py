"""
Configuration for the AI Engine

Environment variables and constants.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the engine-py directory explicitly
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

# OpenRouter API Key (get free at https://openrouter.ai/keys)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

# Model configuration - using free Llama model
LLM_MODEL = os.getenv("LLM_MODEL", "meta-llama/llama-3.2-3b-instruct:free")

# Legacy Gemini support (commented out)
# GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Allowed steps registry (ANTI-HALLUCINATION)
# The LLM can ONLY use these step types
ALLOWED_STEPS = [
    "fetch_stock_price",
    "fetch_crypto_price",
    "fetch_weather",
    "send_notification",
    "send_email",
    "send_whatsapp",
    "send_sms",
    "job_search",
    "job_apply",
    "fetch_url",
    "condition",
    "delay"
]

# Allowed trigger types
ALLOWED_TRIGGERS = [
    "manual",
    "interval",
    "webhook",
    "event"
]

# Valid interval pattern (flexible - allows any reasonable interval)
# Format: <number><unit> where unit = s (seconds), m (minutes), h (hours), d (days), w (weeks)
# Examples: 1m, 2m, 5m, 30s, 2h, 7d, etc.
# This allows users to specify ANY interval in natural language prompts
import re
INTERVAL_PATTERN = re.compile(r'^(\d{1,3})(s|m|h|d|w)$')

def validate_interval_format(interval: str) -> bool:
    """
    Validate interval format without restricting to specific values.
    Accepts: 1s, 2m, 30m, 1h, 2d, etc.
    """
    if not isinstance(interval, str):
        return False
    return INTERVAL_PATTERN.match(interval.lower()) is not None
