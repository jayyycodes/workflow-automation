"""
Smart Workflow Automation Tool - Python AI Engine

Handles AI-powered automation generation using OpenRouter.ai.
Includes multi-turn clarification for incomplete requests.
"""

import json
import re
import logging
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from config import OPENROUTER_API_KEY, GEMINI_API_KEY, LLM_MODEL, GEMINI_MODEL, ALLOWED_STEPS
from prompts import PARSE_INTENT_PROMPT, GENERATE_AUTOMATION_PROMPT, ENTITY_EXTRACTION_PROMPT, TWITTER_RESEARCH_PROMPT

from validator import validate_automation, sanitize_automation

from clarification import ClarificationHandler
from required_fields import normalize_channel_response

# OpenRouter API endpoint
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

app = FastAPI(
    title="Workflow AI Engine",
    description="Python service for AI-powered automation generation using Gemini",
    version="0.3.0"
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    
    # Try Google Gemini FIRST - showcase Google AI for hackathon!
    if GEMINI_API_KEY:
        try:
            logger.info("🤖 Using Google Gemini AI (Primary)")
            result = call_gemini(full_prompt)
            logger.info("✅ Gemini successfully generated automation")
            return result
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
            logger.info("✅ OpenRouter successfully generated automation")
            return result
        except Exception as e:
            openrouter_error = str(e)
            logger.error(f"❌ Both LLM providers failed - Gemini: {gemini_error}, OpenRouter: {openrouter_error}")
            raise HTTPException(
                status_code=500,
                detail="AI service temporarily unavailable. Please try again."
            )
    else:
        openrouter_error = "OPENROUTER_API_KEY not set"
        logger.error("❌ OpenRouter API key not configured.")
        
    raise HTTPException(
        status_code=500,
        detail=f"No LLM API keys configured or both failed. Gemini: {gemini_error}, OpenRouter: {openrouter_error}"
    )


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
        "version": "0.4.0",
        "llm_provider": "openrouter",
        "llm_configured": bool(OPENROUTER_API_KEY),
        "model": LLM_MODEL,
        "allowed_steps": ALLOWED_STEPS,
        "features": ["clarification", "voice_mode", "multi_turn"]
    }


# ============================================================
# Intent Parsing
# ============================================================

@app.post("/parse-intent")
async def parse_intent(request: TextRequest):
    """
    Parse user text into structured intent.
    """
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
# Multi-Turn Conversation (NEW)
# ============================================================

@app.post("/conversation")
async def conversation(request: ConversationRequest):
    """
    Handle multi-turn conversation for automation creation.
    
    - Detects missing required fields
    - Asks ONE clarification question at a time
    - Matches response mode to input mode (voice/text)
    - Returns final automation when complete
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
# Automation Generation (Original)
# ============================================================

@app.post("/generate-automation")
async def generate_automation(request: TextRequest):
    """
    Generate complete automation JSON from user text.
    (Original endpoint - kept for backwards compatibility)
    """
    try:
        full_prompt = f"{GENERATE_AUTOMATION_PROMPT}\n\nUser request: {request.text}"
        response_text = call_llm(full_prompt)
        automation = extract_json_from_response(response_text)
        
        if "error" in automation:
            return {"success": False, "error": automation["error"], "raw_text": request.text}
        
        is_valid, error = validate_automation(automation)
        
        if not is_valid:
            return {"success": False, "error": error, "raw_text": request.text}
        
        automation = sanitize_automation(automation)
        
        return {"success": True, "automation": automation, "raw_text": request.text}
        
    except ValueError as e:
        return {"success": False, "error": f"Failed to parse LLM response: {str(e)}", "raw_text": request.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Twitter Research (Fallback for Scraping)
# ============================================================

@app.post("/research-twitter")
async def research_twitter(request: TextRequest):
    """
    Research latest tweets/activity for a user via AI when scraping is blocked.
    """
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

