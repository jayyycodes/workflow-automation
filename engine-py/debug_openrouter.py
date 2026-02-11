
import os
import requests
import json
from pathlib import Path
from dotenv import load_dotenv

# Explicitly load .env as config.py does
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

api_key = os.getenv("OPENROUTER_API_KEY")

print(f"Loaded API Key: {api_key[:10]}...{api_key[-5:] if api_key else 'None'}")
print(f"Key Length: {len(api_key) if api_key else 0}")

if not api_key:
    print("ERROR: API Key is missing!")
    exit(1)

url = "https://openrouter.ai/api/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Debug Script"
}

data = {
    "model": "meta-llama/llama-3.2-3b-instruct:free",
    "messages": [
        {"role": "user", "content": "Say hello"}
    ]
}

print("\nSending request to OpenRouter...")
try:
    response = requests.post(url, headers=headers, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
