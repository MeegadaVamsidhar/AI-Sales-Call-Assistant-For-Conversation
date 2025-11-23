import requests
import json
import time

base = 'http://localhost:8000'

payload = {
    'room_id': 'test_room_123',
    'customer_id': '9998887777',
    'customer_name': 'Test User',
    'rating': 5,
    'feedback_text': 'Great experience!',
    'service_quality': 5,
    'agent_helpfulness': 5,
    'overall_experience': 5,
    'suggestions': 'Keep it up'
}

print('Posting feedback...')
r = requests.post(base + '/feedback', json=payload)
print('POST status:', r.status_code)
try:
    print('POST body:', r.json())
except Exception:
    print('POST text:', r.text)

# small delay to allow server to log
time.sleep(0.5)

print('\nFetching all feedback...')
r2 = requests.get(base + '/feedback/all')
print('GET status:', r2.status_code)
try:
    print('GET body:', json.dumps(r2.json(), indent=2, default=str))
except Exception as e:
    print('GET text:', r2.text)
    print('Error parsing JSON:', e)
