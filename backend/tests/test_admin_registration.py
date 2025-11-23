#!/usr/bin/env python3
import requests
import json

def test_admin_registration():
    """Test admin registration endpoint"""
    url = "http://localhost:8000/api/auth/admin/register"
    
    # Test data
    test_admin = {
        "name": "Test Admin",
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    try:
        print("Testing admin registration...")
        print(f"URL: {url}")
        print(f"Data: {json.dumps(test_admin, indent=2)}")
        
        response = requests.post(url, json=test_admin)
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Body: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Admin registration successful!")
        else:
            print("❌ Admin registration failed!")
            
    except Exception as e:
        print(f"❌ Error testing registration: {e}")

if __name__ == "__main__":
    test_admin_registration()
