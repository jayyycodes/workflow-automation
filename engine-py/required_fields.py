"""
Required Fields Definition

Defines required fields per intent type for clarification detection.
"""

# Required fields per intent type
REQUIRED_FIELDS = {
    "stock_monitor": {
        "fields": ["symbol", "interval", "notification_channel"],
        "questions": {
            "symbol": {
                "question": "Which stock would you like to monitor?",
                "options": None,  # Free text
                "examples": ["AAPL", "SBIN", "TSLA"]
            },
            "interval": {
                "question": "How often should I check?",
                "options": ["Every minute", "Every 5 minutes", "Every hour", "Daily"],
                "default": "5m"
            },
            "notification_channel": {
                "question": "Where should I send the updates?",
                "options": ["WhatsApp", "Email", "In-app notification"],
                "mapping": {
                    "whatsapp": "send_whatsapp",
                    "email": "send_email",
                    "in-app notification": "send_notification",
                    "in-app": "send_notification",
                    "notification": "send_notification"
                }
            }
        }
    },
    "crypto_monitor": {
        "fields": ["symbol", "interval", "notification_channel"],
        "questions": {
            "symbol": {
                "question": "Which cryptocurrency?",
                "options": ["Bitcoin (BTC)", "Ethereum (ETH)", "Solana (SOL)"],
                "examples": ["BTC", "ETH", "SOL"]
            },
            "interval": {
                "question": "How often should I check?",
                "options": ["Every minute", "Every 5 minutes", "Every hour"],
                "default": "5m"
            },
            "notification_channel": {
                "question": "Where should I send the updates?",
                "options": ["WhatsApp", "Email", "In-app notification"]
            }
        }
    },
    "job_alert": {
        "fields": ["query", "interval", "notification_channel"],
        "questions": {
            "query": {
                "question": "What kind of jobs are you looking for?",
                "options": None,
                "examples": ["ML Engineer", "Frontend Developer", "Data Scientist"]
            },
            "interval": {
                "question": "How often should I search?",
                "options": ["Every hour", "Daily", "Weekly"],
                "default": "1d"
            },
            "notification_channel": {
                "question": "Where should I send job alerts?",
                "options": ["WhatsApp", "Email"]
            }
        }
    },
    "price_alert": {
        "fields": ["symbol", "condition", "threshold", "notification_channel"],
        "questions": {
            "symbol": {
                "question": "Which stock or crypto?",
                "options": None
            },
            "condition": {
                "question": "Should I alert when price goes above or below?",
                "options": ["Above", "Below"]
            },
            "threshold": {
                "question": "At what price should I alert you?",
                "options": None
            },
            "notification_channel": {
                "question": "Where should I send the alert?",
                "options": ["WhatsApp", "Email", "In-app notification"]
            }
        }
    }
}

# Default intent for generic automation
DEFAULT_REQUIRED_FIELDS = ["notification_channel"]


def get_required_fields(intent: str) -> dict:
    """Get required fields configuration for an intent."""
    return REQUIRED_FIELDS.get(intent, {"fields": DEFAULT_REQUIRED_FIELDS, "questions": {}})


def get_missing_field_question(intent: str, field: str) -> dict:
    """Get the clarification question for a missing field."""
    config = get_required_fields(intent)
    questions = config.get("questions", {})
    
    if field in questions:
        return questions[field]
    
    # Default question for unknown fields
    return {
        "question": f"What should the {field.replace('_', ' ')} be?",
        "options": None
    }


def normalize_channel_response(response: str) -> str:
    """Normalize user's channel response to step type."""
    response_lower = response.lower().strip()
    
    channel_mapping = {
        "whatsapp": "send_whatsapp",
        "email": "send_email",
        "in-app": "send_notification",
        "in-app notification": "send_notification",
        "notification": "send_notification",
        "sms": "send_sms"
    }
    
    return channel_mapping.get(response_lower, "send_notification")


def normalize_interval_response(response: str) -> str:
    """Normalize user's interval response to format."""
    response_lower = response.lower().strip()
    
    interval_mapping = {
        "every minute": "1m",
        "every 5 minutes": "5m",
        "every 15 minutes": "15m",
        "every 30 minutes": "30m",
        "every hour": "1h",
        "hourly": "1h",
        "daily": "1d",
        "weekly": "1w"
    }
    
    return interval_mapping.get(response_lower, response)
