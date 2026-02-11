
import requests
import json

api_key = "AIzaSyDJiyTc_llo-k0ajs8uYEIi3_aCe_jWldE"
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
headers = {"Content-Type": "application/json"}
data = {
    "contents": [{
        "parts": [{"text": "Hello"}]
    }]
}

try:
    print(f"Testing URL: {url}")
    response = requests.post(url, headers=headers, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
