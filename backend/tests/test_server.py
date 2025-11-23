#!/usr/bin/env python3
"""
Test if the FastAPI server is running and accessible
"""
import requests
import json

def test_server():
    """Test if the server is running"""
    try:
        print("🔍 Testing FastAPI server connection...")
        
        # Test basic health endpoint
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Server is running and accessible!")
            print(f"📊 Response: {response.json()}")
        else:
            print(f"❌ Server responded with status: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure FastAPI is running on http://localhost:8000")
        print("💡 To start the server, run: python start_server.py")
    except requests.exceptions.Timeout:
        print("❌ Server connection timed out")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_admin_registration():
    """Test admin registration endpoint"""
    try:
        print("\n🔍 Testing admin registration endpoint...")
        
        test_data = {
            "name": "Test Admin",
            "email": "test@example.com",
            "password": "testpassword123",
            "department": "IT"
        }
        
        response = requests.post(
            "http://localhost:8000/api/auth/admin/register",
            json=test_data,
            timeout=10
        )
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📄 Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Admin registration endpoint is working!")
        else:
            print("⚠️ Admin registration endpoint returned an error")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server for admin registration test")
    except Exception as e:
        print(f"❌ Error testing admin registration: {e}")

if __name__ == "__main__":
    test_server()
    test_admin_registration()
