
import requests
import json

api_key = "AIzaSyDJiyTc_llo-k0ajs8uYEIi3_aCe_jWldE"
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

try:
    response = requests.get(url)
    if response.status_code == 200:
        models = response.json().get('models', [])
        with open('model_list.txt', 'w') as f:
            for m in models:
                if 'gemini' in m['name']:
                    f.write(m['name'] + '\n')
        print("Done writing model_list.txt")
    else:
        print(f"Error: {response.status_code} {response.text}")
except Exception as e:
    print(f"Error: {e}")
