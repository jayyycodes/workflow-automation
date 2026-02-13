"""
Smart Workflow Automation Tool - Python AI Engine (v2)

Self-healing AI service with:
- Auto-retry for generation failures (max 3 attempts)
- Registry-aware tool validation
- Dynamic prompt injection from tool registry
- Backward-compatible API
"""

import json
import re
import logging
import httpx
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from config import OPENROUTER_API_KEY, GEMINI_API_KEY, LLM_MODEL, GEMINI_MODEL, ALLOWED_STEPS
from prompts import (
    PARSE_INTENT_PROMPT, 
    ENTITY_EXTRACTION_PROMPT, 
    TWITTER_RESEARCH_PROMPT,
    RETRY_CORRECTION_PROMPT,
    build_generation_prompt,
    fetch_registry,
    get_allowed_tool_names
)

from validator import validate_automation, sanitize_automation
from clarification import ClarificationHandler
from required_fields import normalize_channel_response

# OpenRouter API endpoint
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

app = FastAPI(
    title="Workflow AI Engine",
    description="Self-healing AI service for automation generation with auto-retry",
    version="2.0.0"
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── Retry Configuration ────────────────────────────────────────────────

RETRY_CONFIG = {
    "max_attempts": 3,
    "base_delay_seconds": 1,    # 1s, 2s, 4s exponential
    "max_delay_seconds": 10,
}

# CORS for Node.js backend and frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://workflow-automation-green.vercel.app",
        "https://*.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Startup Event — Load Tool Registry
# ============================================================

@app.on_event("startup")
async def startup_event():
    """Load tool registry from Node.js backend on startup."""
    logger.info("🚀 AI Engine starting up...")
    try:
        fetch_registry("http://localhost:3000")
    except Exception as e:
        logger.warning(f"⚠️ Registry fetch failed at startup (will use fallback): {e}")


# ============================================================
# Request/Response Models
# ============================================================

class TextRequest(BaseModel):
    """Request model with user text"""
    text: str


class ConversationRequest(BaseModel):
    """Request model for multi-turn conversation"""
    text: str
    input_mode: str = "text"  # "voice" or "text"
    context: Optional[dict] = None


class IntentResponse(BaseModel):
    """Response model for parsed intent"""
    intent: str
    entities: dict
    channel: str


# ============================================================
# Helper Functions
# ============================================================

def extract_json_from_response(text: str) -> dict:
    """
    Extract JSON from LLM response, handling markdown code blocks.
    """
    text = text.strip()
    
    # Try to find JSON in code blocks
    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if json_match:
        text = json_match.group(1)
    
    # Try to find raw JSON object
    json_match = re.search(r'\{[\s\S]*\}', text)
    if json_match:
        text = json_match.group(0)
    
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON: {e}")


def call_llm(full_prompt: str) -> str:
    """
    Call LLM to generate automation from natural language.
    Tries Google Gemini first (primary), falls back to OpenRouter.
    """
    gemini_error = None
    openrouter_error = None
    
    # Try Google Gemini FIRST
    if GEMINI_API_KEY:
        try:
            logger.info("🤖 Using Google Gemini AI (Primary)")
            result = call_gemini(full_prompt)
            logger.info("✅ Gemini successfully generated response")
            return result
        except httpx.HTTPStatusError as e:
            gemini_error = f"HTTP {e.response.status_code}: {e.response.text[:200]}"
            if e.response.status_code == 429:
                logger.warning(f"⚠️ Gemini rate limited (429), trying OpenRouter...")
            else:
                logger.warning(f"⚠️ Gemini failed: {gemini_error}")
        except Exception as e:
            gemini_error = str(e)
            logger.warning(f"⚠️ Gemini failed: {gemini_error}, trying OpenRouter fallback...")
    else:
        gemini_error = "GEMINI_API_KEY not set"
        logger.info("Gemini API key not configured, skipping Gemini.")
        
    # Fallback to OpenRouter if Gemini fails or not configured
    if OPENROUTER_API_KEY:
        try:
            logger.info("🔄 Using OpenRouter (Fallback)")
            result = call_openrouter(full_prompt)
            logger.info("✅ OpenRouter successfully generated response")
            return result
        except httpx.HTTPStatusError as e:
            openrouter_error = f"HTTP {e.response.status_code}: {e.response.text[:200]}"
            if e.response.status_code == 429:
                logger.error(f"❌ OpenRouter also rate limited (429)")
            else:
                logger.error(f"❌ OpenRouter failed: {openrouter_error}")
        except Exception as e:
            openrouter_error = str(e)
            logger.error(f"❌ Both LLM providers failed - Gemini: {gemini_error}, OpenRouter: {openrouter_error}")
    else:
        openrouter_error = "OPENROUTER_API_KEY not set"
        logger.error("❌ OpenRouter API key not configured.")

    # Build informative error message
    is_rate_limited = "429" in str(gemini_error or "") and "429" in str(openrouter_error or "")
    if is_rate_limited:
        detail = "Both AI providers are rate limited (429). Please wait a minute and try again, or update your API keys."
    else:
        detail = f"AI service temporarily unavailable. Gemini: {gemini_error}, OpenRouter: {openrouter_error}"
    
    raise HTTPException(status_code=503 if is_rate_limited else 500, detail=detail)


def call_openrouter(full_prompt: str) -> str:
    """Call OpenRouter API"""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Smart Workflow Automation"
    }
    
    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "user", "content": full_prompt}
        ]
    }
    
    with httpx.Client(timeout=60.0) as client:
        response = client.post(OPENROUTER_URL, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]


def call_gemini(full_prompt: str) -> str:
    """Call Google Gemini API"""
    from config import GEMINI_API_KEY, GEMINI_MODEL
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "contents": [{
            "parts": [{"text": full_prompt}]
        }]
    }
    
    with httpx.Client(timeout=60.0) as client:
        response = client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        return result["candidates"][0]["content"]["parts"][0]["text"]


# ============================================================
# Auto-Retry Generation (NEW)
# ============================================================

def generate_with_retry(user_request: str) -> dict:
    """
    Generate automation JSON with self-healing retry loop.
    
    Flow:
    1. Generate with full prompt
    2. Parse JSON response
    3. Validate against schema + registry
    4. If invalid → build retry prompt with error context → re-call LLM
    5. Max 3 attempts with exponential backoff
    
    Returns: { success, automation, attempts, errors }
    """
    attempts = []
    max_attempts = RETRY_CONFIG["max_attempts"]
    
    for attempt in range(1, max_attempts + 1):
        attempt_start = time.time()
        error_msg = None
        raw_output = None
        
        try:
            if attempt == 1:
                # First attempt: use full generation prompt
                full_prompt = build_generation_prompt(user_request)
            else:
                # Retry: use correction prompt with error context
                prev_error = attempts[-1]["error"]
                prev_output = attempts[-1]["raw_output"] or "No output"
                
                full_prompt = RETRY_CORRECTION_PROMPT.format(
                    error=prev_error,
                    invalid_output=prev_output[:2000],  # Truncate to avoid token limits
                    user_request=user_request,
                    allowed_steps=", ".join(get_allowed_tool_names())
                )
            
            # Call LLM — HTTPException means provider is down, don't retry
            response_text = call_llm(full_prompt)
            raw_output = response_text
            
            # Parse JSON
            automation = extract_json_from_response(response_text)
            
            # Check for error response from LLM
            if "error" in automation:
                error_msg = f"LLM returned error: {automation['error']}"
                raise ValueError(error_msg)
            
            # Validate
            is_valid, validation_error = validate_automation(automation)
            
            if not is_valid:
                error_msg = f"Validation failed: {validation_error}"
                raise ValueError(error_msg)
            
            # Sanitize
            automation = sanitize_automation(automation)
            
            # Success!
            duration = time.time() - attempt_start
            attempts.append({
                "attempt": attempt,
                "status": "success",
                "duration_seconds": round(duration, 2),
                "error": None,
                "raw_output": None
            })
            
            logger.info(f"✅ Generation succeeded on attempt {attempt}/{max_attempts}", extra={
                "attempt": attempt,
                "duration": round(duration, 2)
            })
            
            return {
                "success": True,
                "automation": automation,
                "attempts": len(attempts),
                "attempt_details": attempts
            }
            
        except HTTPException:
            # LLM provider is down — don't retry, propagate immediately
            raise
        except ValueError as e:
            error_msg = str(e)
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
        
        # Record failed attempt
        duration = time.time() - attempt_start
        attempts.append({
            "attempt": attempt,
            "status": "failed",
            "duration_seconds": round(duration, 2),
            "error": error_msg,
            "raw_output": raw_output[:500] if raw_output else None
        })
        
        logger.warning(f"⚠️ Generation attempt {attempt}/{max_attempts} failed: {error_msg}")
        
        # Exponential backoff before retry
        if attempt < max_attempts:
            delay = min(
                RETRY_CONFIG["base_delay_seconds"] * (2 ** (attempt - 1)),
                RETRY_CONFIG["max_delay_seconds"]
            )
            logger.info(f"⏳ Waiting {delay}s before retry...")
            time.sleep(delay)
    
    # All attempts failed
    logger.error(f"❌ Generation failed after {max_attempts} attempts")
    
    return {
        "success": False,
        "automation": None,
        "attempts": len(attempts),
        "attempt_details": attempts,
        "final_error": attempts[-1]["error"] if attempts else "Unknown error"
    }


def build_automation_from_context(context: dict) -> dict:
    """Build automation JSON from collected context."""
    intent = context.get("intent", "custom")
    
    # Build trigger
    interval = context.get("interval", "5m")
    trigger = {"type": "interval", "every": interval}
    
    # Build steps based on intent
    steps = []
    
    if intent == "stock_monitor":
        symbol = context.get("symbol", "UNKNOWN")
        steps.append({"type": "fetch_stock_price", "symbol": symbol.upper()})
    elif intent == "crypto_monitor":
        symbol = context.get("symbol", "BTC")
        steps.append({"type": "fetch_crypto_price", "symbol": symbol.upper()})
    elif intent == "job_alert":
        query = context.get("query", "developer")
        steps.append({"type": "job_search", "query": query})
    
    # Add notification step
    channel = context.get("notification_channel", "send_notification")
    if channel.startswith("send_"):
        notification_type = channel
    else:
        notification_type = normalize_channel_response(channel)
    
    symbol = context.get("symbol", "")
    steps.append({
        "type": notification_type,
        "message": f"{symbol.upper()} update" if symbol else "Automation update"
    })
    
    # Build name
    name = f"{context.get('symbol', 'Automation').upper()} {intent.replace('_', ' ').title()}"
    
    return {
        "name": name,
        "description": f"Auto-generated {intent} automation",
        "trigger": trigger,
        "steps": steps,
        "status": "draft"
    }


# ============================================================
# Health Check
# ============================================================

@app.get("/health")
async def health_check():
    """Service health check endpoint"""
    return {
        "status": "python service ready",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "llm_provider": "gemini + openrouter",
        "llm_configured": bool(GEMINI_API_KEY or OPENROUTER_API_KEY),
        "model": GEMINI_MODEL if GEMINI_API_KEY else LLM_MODEL,
        "allowed_steps": get_allowed_tool_names(),
        "features": ["clarification", "voice_mode", "multi_turn", "auto_retry", "registry_aware"]
    }


# ============================================================
# Intent Parsing
# ============================================================

@app.post("/parse-intent")
async def parse_intent(request: TextRequest):
    """Parse user text into structured intent."""
    try:
        full_prompt = f"{PARSE_INTENT_PROMPT}\n\nUser request: {request.text}"
        response_text = call_llm(full_prompt)
        result = extract_json_from_response(response_text)
        
        return {
            "success": True,
            "intent": result.get("intent", "custom"),
            "entities": result.get("entities", {}),
            "channel": result.get("channel", "notification"),
            "raw_text": request.text
        }
        
    except ValueError as e:
        return {"success": False, "error": str(e), "raw_text": request.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Multi-Turn Conversation
# ============================================================

@app.post("/conversation")
async def conversation(request: ConversationRequest):
    """
    Handle multi-turn conversation for automation creation.
    Uses auto-retry when generating final automation.
    """
    input_mode = request.input_mode
    context = request.context or {}
    previous_answers = context.get("previous_answers", {})
    
    try:
        # Check if this is a continuation (answering a clarification)
        if context.get("awaiting_field"):
            # User is answering a previous question
            awaiting_field = context["awaiting_field"]
            partial_context = context.get("partial_context", {})
            
            # Merge the new answer
            updated_context = ClarificationHandler.merge_context(
                partial_context, 
                awaiting_field, 
                request.text
            )
            
            # Check if more fields are missing
            intent = updated_context.get("intent", "stock_monitor")
            
            if ClarificationHandler.needs_clarification(intent, updated_context):
                # Need more info - ask next question
                clarification = ClarificationHandler.get_next_question(
                    intent, updated_context, input_mode
                )
                clarification["awaiting_field"] = clarification["missing_field"]
                return clarification
            else:
                # All fields collected - generate automation
                automation = build_automation_from_context(updated_context)
                automation = sanitize_automation(automation)
                
                confirmation = ClarificationHandler.generate_confirmation(
                    automation, input_mode
                )
                
                return {
                    "success": True,
                    "needs_clarification": False,
                    "automation": automation,
                    **confirmation
                }
        
        # First turn - parse intent and extract entities
        full_prompt = f"{ENTITY_EXTRACTION_PROMPT}\n\nUser request: {request.text}"
        response_text = call_llm(full_prompt)
        extracted = extract_json_from_response(response_text)
        
        intent = extracted.get("intent", "stock_monitor")
        entities = extracted.get("entities", {})
        
        # Check for missing required fields
        if ClarificationHandler.needs_clarification(intent, entities):
            # Generate clarification question
            clarification = ClarificationHandler.get_next_question(
                intent, entities, input_mode
            )
            clarification["awaiting_field"] = clarification["missing_field"]
            return clarification
        else:
            # All info present - generate automation directly
            automation = build_automation_from_context(entities)
            automation = sanitize_automation(automation)
            
            confirmation = ClarificationHandler.generate_confirmation(
                automation, input_mode
            )
            
            return {
                "success": True,
                "needs_clarification": False,
                "automation": automation,
                **confirmation
            }
    
    except ValueError as e:
        return {
            "success": False,
            "error": str(e),
            "response_mode": input_mode,
            "text": "I'm sorry, I couldn't understand that. Could you try rephrasing?"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Automation Generation (with Auto-Retry)
# ============================================================

@app.post("/generate-automation")
async def generate_automation(request: TextRequest):
    """
    Generate complete automation JSON from user text.
    Now with auto-retry: if generation fails, retries with error context.
    """
    result = generate_with_retry(request.text)
    
    if result["success"]:
        return {
            "success": True,
            "automation": result["automation"],
            "raw_text": request.text,
            "attempts": result["attempts"],
            "retried": result["attempts"] > 1
        }
    else:
        return {
            "success": False,
            "error": result["final_error"],
            "raw_text": request.text,
            "attempts": result["attempts"],
            "attempt_details": result["attempt_details"]
        }


# ============================================================
# Registry Refresh
# ============================================================

@app.post("/refresh-registry")
async def refresh_registry():
    """Force refresh of tool registry from Node.js backend."""
    try:
        data = fetch_registry("http://localhost:3000")
        if data:
            return {"success": True, "message": "Registry refreshed", "tools": len(data.get("toolNames", []))}
        else:
            return {"success": False, "message": "Could not reach registry endpoint"}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ============================================================
# Twitter Research (Fallback for Scraping)
# ============================================================

@app.post("/research-twitter")
async def research_twitter(request: TextRequest):
    """Research latest tweets/activity for a user via AI when scraping is blocked."""
    try:
        username = request.text.replace('@', '').strip()
        logger.info(f"🔍 Researching Twitter activity for @{username}")
        
        full_prompt = TWITTER_RESEARCH_PROMPT.format(username=username)
        response_text = call_llm(full_prompt)
        
        return {
            "success": True,
            "username": username,
            "data": response_text
        }
    except Exception as e:
        logger.error(f"❌ Twitter research failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Run with: uvicorn app:app --reload --port 8000
# ============================================================
