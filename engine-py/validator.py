"""
Validation Layer for Automation JSON

Validates LLM output before returning to Node.js.
"""

from typing import Tuple, Optional
from config import ALLOWED_STEPS, ALLOWED_TRIGGERS, validate_interval_format


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
    
    # Validate each step
    for i, step in enumerate(data["steps"]):
        step_valid, step_error = validate_step(step)
        if not step_valid:
            return False, f"Step {i + 1}: {step_error}"
    
    return True, None


def validate_trigger(trigger: dict) -> Tuple[bool, Optional[str]]:
    """Validate trigger configuration."""
    
    if "type" not in trigger:
        return False, "Trigger missing 'type' field"
    
    if trigger["type"] not in ALLOWED_TRIGGERS:
        return False, f"Invalid trigger type: {trigger['type']}"
    
    # Interval trigger must have 'every' field
    if trigger["type"] == "interval":
        if "every" not in trigger:
            return False, "Interval trigger missing 'every' field"
        
        # Validate format but don't restrict to specific intervals
        if not validate_interval_format(trigger["every"]):
            return False, f"Invalid interval format: '{trigger['every']}'. Use format like: 2m, 30s, 1h, 2d, 1w (number + unit)"
    
    return True, None


def validate_step(step: dict) -> Tuple[bool, Optional[str]]:
    """Validate a single step."""
    
    if not isinstance(step, dict):
        return False, "Step must be an object"
    
    if "type" not in step:
        return False, "Step missing 'type' field"
    
    step_type = step["type"]
    
    # Check against allowed steps (ANTI-HALLUCINATION)
    if step_type not in ALLOWED_STEPS:
        return False, f"Unsupported step type: {step_type}"
    
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
    
    elif step_type == "send_sms":
        if "to" not in step:
            return False, "send_sms requires 'to'"
    
    elif step_type == "job_search":
        if "query" not in step:
            return False, "job_search requires 'query'"
    
    elif step_type == "condition":
        if "if" not in step:
            return False, "condition requires 'if'"
    
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
