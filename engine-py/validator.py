"""
Validation Layer for Automation JSON (v2)

Registry-aware validation:
- Dynamically loads allowed steps from Node.js registry
- Falls back to hardcoded ALLOWED_STEPS
- Structured error messages for retry loop
"""

import logging
import httpx
from typing import Tuple, Optional, List
from config import ALLOWED_STEPS, ALLOWED_TRIGGERS, validate_interval_format

logger = logging.getLogger(__name__)

# ─── Registry-Aware Step List ────────────────────────────────────────────

_dynamic_allowed_steps = None

def get_allowed_steps() -> list:
    """Get allowed steps — from registry if available, else fallback."""
    global _dynamic_allowed_steps
    if _dynamic_allowed_steps:
        return _dynamic_allowed_steps
    return ALLOWED_STEPS

def refresh_allowed_steps(base_url: str = "http://localhost:3000") -> list:
    """Fetch allowed steps from Node.js registry."""
    global _dynamic_allowed_steps
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(f"{base_url}/registry/tools")
            response.raise_for_status()
            data = response.json()
            _dynamic_allowed_steps = [t["name"] for t in data.get("tools", [])]
            logger.info(f"✅ Validator loaded {len(_dynamic_allowed_steps)} allowed steps from registry")
            return _dynamic_allowed_steps
    except Exception as e:
        logger.warning(f"⚠️ Could not refresh steps from registry: {e}. Using fallback.")
        return ALLOWED_STEPS


# ─── Main Validation ─────────────────────────────────────────────────────

def validate_automation(data: dict) -> Tuple[bool, Optional[str]]:
    """
    Validate automation JSON structure and content.
    
    Returns:
        (True, None) if valid
        (False, error_message) if invalid
    """
    
    # Check for error response from LLM
    if "error" in data:
        return True, None  # Pass through LLM errors
    
    # Required fields
    if "name" not in data or not isinstance(data["name"], str):
        return False, "Missing or invalid 'name' field"
    
    if "trigger" not in data or not isinstance(data["trigger"], dict):
        return False, "Missing or invalid 'trigger' field"
    
    if "steps" not in data or not isinstance(data["steps"], list):
        return False, "Missing or invalid 'steps' field"
    
    if len(data["steps"]) == 0:
        return False, "Automation must have at least one step"
    
    # Validate trigger
    trigger_valid, trigger_error = validate_trigger(data["trigger"])
    if not trigger_valid:
        return False, trigger_error
    
    # Validate each step (using dynamic allowed list)
    allowed = get_allowed_steps()
    for i, step in enumerate(data["steps"]):
        step_valid, step_error = validate_step(step, allowed)
        if not step_valid:
            return False, f"Step {i + 1}: {step_error}"
    
    return True, None


def validate_trigger(trigger: dict) -> Tuple[bool, Optional[str]]:
    """Validate trigger configuration."""
    
    if "type" not in trigger:
        return False, "Trigger missing 'type' field"
    
    if trigger["type"] not in ALLOWED_TRIGGERS:
        return False, f"Invalid trigger type: {trigger['type']}. Allowed: {', '.join(ALLOWED_TRIGGERS)}"
    
    # Interval trigger must have 'every' field
    if trigger["type"] == "interval":
        if "every" not in trigger:
            return False, "Interval trigger missing 'every' field"
        
        # Validate format but don't restrict to specific intervals
        if not validate_interval_format(trigger["every"]):
            return False, f"Invalid interval format: '{trigger['every']}'. Use format like: 2m, 30s, 1h, 2d, 1w (number + unit)"
    
    # RSS trigger must have 'url' field
    if trigger["type"] == "rss":
        if "url" not in trigger:
            return False, "RSS trigger missing 'url' field (the RSS feed URL to poll)"
    
    return True, None


def validate_step(step: dict, allowed_steps: list = None) -> Tuple[bool, Optional[str]]:
    """Validate a single step against allowed steps."""
    
    if allowed_steps is None:
        allowed_steps = get_allowed_steps()
    
    if not isinstance(step, dict):
        return False, "Step must be an object"
    
    if "type" not in step:
        return False, "Step missing 'type' field"
    
    step_type = step["type"]
    
    # Check against allowed steps (ANTI-HALLUCINATION)
    if step_type not in allowed_steps:
        return False, f"Unsupported step type: '{step_type}'. Allowed types: {', '.join(allowed_steps)}"
    
    # Validate step-specific required fields
    if step_type == "fetch_stock_price":
        if "symbol" not in step:
            return False, "fetch_stock_price requires 'symbol'"
    
    elif step_type == "fetch_crypto_price":
        if "symbol" not in step:
            return False, "fetch_crypto_price requires 'symbol'"
    
    elif step_type == "send_email":
        if "to" not in step:
            return False, "send_email requires 'to'"
    
    elif step_type == "send_whatsapp":
        if "to" not in step:
            return False, "send_whatsapp requires 'to'"
        if "message" not in step:
            return False, "send_whatsapp requires 'message'"
    
    elif step_type == "send_sms":
        if "to" not in step:
            return False, "send_sms requires 'to'"
        if "message" not in step:
            return False, "send_sms requires 'message'"
    
    elif step_type == "send_discord":
        if "webhook_url" not in step:
            return False, "send_discord requires 'webhook_url'"
        if "message" not in step:
            return False, "send_discord requires 'message'"
    
    elif step_type == "send_slack":
        if "webhook_url" not in step:
            return False, "send_slack requires 'webhook_url'"
        if "message" not in step:
            return False, "send_slack requires 'message'"
    
    elif step_type == "job_search":
        if "query" not in step:
            return False, "job_search requires 'query'"
    
    elif step_type == "condition":
        if "if" not in step:
            return False, "condition requires 'if' field (not 'condition')"
    
    elif step_type == "scrape_reddit":
        if "subreddit" not in step:
            return False, "scrape_reddit requires 'subreddit'"
    
    elif step_type == "scrape_twitter":
        if "username" not in step:
            return False, "scrape_twitter requires 'username'"
    
    elif step_type == "http_request":
        if "url" not in step:
            return False, "http_request requires 'url'"
    
    elif step_type == "fetch_rss_feed":
        if "url" not in step:
            return False, "fetch_rss_feed requires 'url'"
    
    elif step_type == "ai_summarize":
        if "text" not in step:
            return False, "ai_summarize requires 'text'"
    
    elif step_type in ("read_google_sheet", "write_google_sheet", "append_google_sheet"):
        if "spreadsheetId" not in step:
            return False, f"{step_type} requires 'spreadsheetId'"
        if "range" not in step:
            return False, f"{step_type} requires 'range'"
    
    return True, None


def sanitize_automation(data: dict) -> dict:
    """
    Sanitize and normalize automation data.
    Adds default values where appropriate.
    """
    
    # Add status if missing
    if "status" not in data:
        data["status"] = "draft"
    
    # Add description if missing
    if "description" not in data:
        data["description"] = f"Automation: {data.get('name', 'Unnamed')}"
    
    return data
