"""
Clarification Logic Module

Handles multi-turn conversation for incomplete automation requests.
"""

import json
from typing import Optional, Tuple
from required_fields import (
    get_required_fields, 
    get_missing_field_question,
    normalize_channel_response,
    normalize_interval_response
)


class ClarificationHandler:
    """Handles clarification detection and question generation."""
    
    @staticmethod
    def detect_missing_fields(intent: str, extracted_entities: dict) -> list:
        """
        Detect which required fields are missing.
        
        Returns list of missing field names.
        """
        config = get_required_fields(intent)
        required = config.get("fields", [])
        
        missing = []
        for field in required:
            if field not in extracted_entities or not extracted_entities.get(field):
                missing.append(field)
        
        return missing
    
    @staticmethod
    def needs_clarification(intent: str, extracted_entities: dict) -> bool:
        """Check if clarification is needed."""
        missing = ClarificationHandler.detect_missing_fields(intent, extracted_entities)
        return len(missing) > 0
    
    @staticmethod
    def get_next_question(intent: str, extracted_entities: dict, input_mode: str = "text") -> Optional[dict]:
        """
        Get the next clarification question.
        Only asks ONE question at a time.
        """
        missing = ClarificationHandler.detect_missing_fields(intent, extracted_entities)
        
        if not missing:
            return None
        
        # Ask about the first missing field only
        next_field = missing[0]
        question_config = get_missing_field_question(intent, next_field)
        
        # Build response based on input mode
        question_text = question_config.get("question", f"What should the {next_field} be?")
        options = question_config.get("options")
        
        # Format for voice vs text
        if input_mode == "voice":
            if options:
                options_text = ", ".join(options[:-1]) + f", or {options[-1]}" if len(options) > 1 else options[0]
                full_question = f"{question_text} You can say {options_text}."
                ssml = f"<speak>{question_text} <break time='300ms'/> You can say {options_text}.</speak>"
            else:
                full_question = question_text
                ssml = f"<speak>{question_text}</speak>"
        else:
            full_question = question_text
            ssml = None
        
        return {
            "needs_clarification": True,
            "missing_field": next_field,
            "question": full_question,
            "options": options,
            "response_mode": input_mode,
            "ssml": ssml,
            "partial_context": {
                "intent": intent,
                **extracted_entities
            }
        }
    
    @staticmethod
    def merge_context(previous_context: dict, new_field: str, new_value: str) -> dict:
        """Merge new answer into existing context."""
        updated = previous_context.copy()
        
        # Normalize values based on field type
        if new_field == "notification_channel":
            updated[new_field] = normalize_channel_response(new_value)
        elif new_field == "interval":
            updated[new_field] = normalize_interval_response(new_value)
        else:
            updated[new_field] = new_value
        
        return updated
    
    @staticmethod
    def generate_confirmation(automation: dict, input_mode: str = "text") -> dict:
        """Generate a confirmation message after successful automation creation."""
        name = automation.get("name", "Your automation")
        trigger = automation.get("trigger", {})
        steps = automation.get("steps", [])
        
        # Build description
        if trigger.get("type") == "interval":
            interval = trigger.get("every", "periodically")
            timing = f"every {interval}"
        elif trigger.get("type") == "daily":
            timing = f"daily at {trigger.get('at', 'scheduled time')}"
        else:
            timing = "when you trigger it"
        
        # Find notification channel
        channel = "notify you"
        for step in steps:
            if step.get("type") == "send_whatsapp":
                channel = "message you on WhatsApp"
            elif step.get("type") == "send_email":
                channel = "email you"
            elif step.get("type") == "send_notification":
                channel = "send you a notification"
        
        text = f"Done! I'll {channel} {timing}."
        
        if input_mode == "voice":
            ssml = f"<speak>Done! <break time='200ms'/> I'll {channel} {timing}.</speak>"
        else:
            ssml = None
        
        return {
            "response_mode": input_mode,
            "text": text,
            "ssml": ssml
        }


def format_response(data: dict, input_mode: str = "text") -> dict:
    """Format response with correct modality."""
    data["response_mode"] = input_mode
    return data
