"""
Test script for Call Summary Generation System
Module 4: Post-Call Summary & Insight Generation

This script demonstrates how to test the call summary generation functionality.
"""

import requests
import json
from datetime import datetime

# Backend API base URL
BASE_URL = "http://localhost:8000"

def test_generate_call_summary(room_id: str):
    """Test generating a call summary for a specific room"""
    print(f"\n{'='*60}")
    print(f"Testing Call Summary Generation for Room: {room_id}")
    print(f"{'='*60}\n")
    
    url = f"{BASE_URL}/api/call-summary/generate/{room_id}"
    
    try:
        response = requests.post(url, params={"manual_notes": "Test call for demonstration"})
        
        if response.status_code == 200:
            data = response.json()
            summary = data.get("summary", {})
            
            print("✅ Call Summary Generated Successfully!\n")
            print(f"📋 Summary ID: {summary.get('summary_id')}")
            print(f"🎯 Call Outcome: {summary.get('call_outcome')}")
            print(f"📞 Total Messages: {summary.get('total_messages')}")
            print(f"⏱️  Call Duration: {summary.get('call_duration_seconds')} seconds")
            print(f"👤 Customer: {summary.get('customer_name', 'N/A')}")
            
            print(f"\n📝 Conversation Summary:")
            print(f"   {summary.get('conversation_summary')}")
            
            print(f"\n🎯 Key Topics Discussed:")
            for topic in summary.get('key_topics', []):
                print(f"   • {topic}")
            
            print(f"\n📚 Books Discussed:")
            for book in summary.get('books_discussed', [])[:3]:
                print(f"   • '{book.get('title')}' (mentioned by {book.get('mentioned_by')})")
            
            print(f"\n⚠️  Customer Objections Raised: {len(summary.get('objections_raised', []))}")
            for objection in summary.get('objections_raised', [])[:3]:
                print(f"   • Type: {objection.get('type')} - Keyword: {objection.get('keyword')}")
            
            print(f"\n✅ Concerns Addressed: {len(summary.get('concerns_addressed', []))}")
            
            print(f"\n😊 Overall Sentiment: {summary.get('overall_sentiment')}")
            print(f"📊 Engagement Level: {summary.get('engagement_level')}")
            print(f"⭐ Customer Satisfaction: {summary.get('customer_satisfaction')}")
            
            print(f"\n🎖️  Agent Performance:")
            print(f"   • Response Quality: {summary.get('agent_response_quality')}")
            print(f"   • Recommendations Made: {summary.get('recommendations_made')}")
            print(f"   • Objection Handling Score: {summary.get('objection_handling_score')}")
            print(f"   • Closing Effectiveness: {summary.get('closing_effectiveness')}")
            
            print(f"\n💪 Strengths:")
            for strength in summary.get('strengths', []):
                print(f"   ✓ {strength}")
            
            print(f"\n📈 Improvement Areas:")
            for area in summary.get('improvement_areas', []):
                print(f"   → {area}")
            
            print(f"\n📋 Follow-up Actions:")
            for action in summary.get('follow_up_actions', []):
                print(f"   • {action}")
            
            print(f"\n🎓 Coaching Points:")
            for point in summary.get('coaching_points', []):
                print(f"   • {point}")
            
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   {response.json()}")
            return False
            
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        return False


def test_get_call_summary(room_id: str):
    """Test retrieving an existing call summary"""
    print(f"\n{'='*60}")
    print(f"Testing Get Call Summary for Room: {room_id}")
    print(f"{'='*60}\n")
    
    url = f"{BASE_URL}/api/call-summary/{room_id}"
    
    try:
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            summary = data.get("summary", {})
            print(f"✅ Call Summary Retrieved Successfully!")
            print(f"   Summary ID: {summary.get('summary_id')}")
            print(f"   Call Outcome: {summary.get('call_outcome')}")
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   {response.json()}")
            return False
            
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        return False


def test_get_all_summaries():
    """Test getting all call summaries"""
    print(f"\n{'='*60}")
    print(f"Testing Get All Call Summaries")
    print(f"{'='*60}\n")
    
    url = f"{BASE_URL}/api/call-summaries/all"
    
    try:
        response = requests.get(url, params={"limit": 10})
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Retrieved {data.get('total')} call summaries")
            
            for i, summary in enumerate(data.get('summaries', [])[:5], 1):
                print(f"\n{i}. Summary ID: {summary.get('summary_id')}")
                print(f"   Room: {summary.get('room_id')}")
                print(f"   Outcome: {summary.get('call_outcome')}")
                print(f"   Customer: {summary.get('customer_name', 'N/A')}")
            
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        return False


def test_get_summaries_by_outcome(outcome: str):
    """Test filtering summaries by outcome"""
    print(f"\n{'='*60}")
    print(f"Testing Get Summaries by Outcome: {outcome}")
    print(f"{'='*60}\n")
    
    url = f"{BASE_URL}/api/call-summaries/by-outcome/{outcome}"
    
    try:
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Retrieved {data.get('total')} summaries with outcome '{outcome}'")
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        return False


def test_get_analytics():
    """Test getting call summaries analytics"""
    print(f"\n{'='*60}")
    print(f"Testing Call Summaries Analytics")
    print(f"{'='*60}\n")
    
    url = f"{BASE_URL}/api/call-summaries/analytics"
    
    try:
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"✅ Analytics Retrieved Successfully!\n")
            print(f"📊 Total Calls Analyzed: {data.get('total_calls')}")
            print(f"🎯 Success Rate: {data.get('success_rate')}%")
            print(f"⭐ Average Satisfaction: {data.get('average_satisfaction')}")
            print(f"🛡️  Average Objection Handling: {data.get('average_objection_handling_score')}")
            print(f"💡 Average Recommendations Made: {data.get('average_recommendations_made')}")
            
            print(f"\n📈 Outcomes Distribution:")
            for outcome, count in data.get('outcomes_distribution', {}).items():
                print(f"   • {outcome}: {count}")
            
            print(f"\n⚠️  Top Objections:")
            for objection in data.get('top_objections', [])[:5]:
                print(f"   • {objection.get('type')}: {objection.get('count')} times")
            
            print(f"\n📈 Top Improvement Areas:")
            for improvement in data.get('top_improvement_areas', [])[:5]:
                print(f"   • {improvement.get('area')}: {improvement.get('count')} times")
            
            print(f"\n🎖️  Agent Performance Distribution:")
            for level, count in data.get('agent_performance_distribution', {}).items():
                print(f"   • {level}: {count}")
            
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        return False


def main():
    """Main test function"""
    print("\n" + "="*60)
    print("   CALL SUMMARY GENERATION SYSTEM - TEST SUITE")
    print("   Module 4: Post-Call Summary & Insight Generation")
    print("="*60)
    
    # Test with a sample room ID (replace with an actual room ID from your system)
    test_room_id = "test_room_001"
    
    print("\n📝 Note: Make sure the backend server is running on http://localhost:8000")
    print("         and that there are transcripts available for the test room.\n")
    
    input("Press Enter to start testing...")
    
    # Run tests
    tests_passed = 0
    tests_total = 0
    
    # Test 1: Generate call summary
    tests_total += 1
    if test_generate_call_summary(test_room_id):
        tests_passed += 1
    
    # Test 2: Get call summary
    tests_total += 1
    if test_get_call_summary(test_room_id):
        tests_passed += 1
    
    # Test 3: Get all summaries
    tests_total += 1
    if test_get_all_summaries():
        tests_passed += 1
    
    # Test 4: Get summaries by outcome
    tests_total += 1
    if test_get_summaries_by_outcome("success"):
        tests_passed += 1
    
    # Test 5: Get analytics
    tests_total += 1
    if test_get_analytics():
        tests_passed += 1
    
    # Summary
    print(f"\n{'='*60}")
    print(f"   TEST SUMMARY")
    print(f"{'='*60}")
    print(f"✅ Tests Passed: {tests_passed}/{tests_total}")
    print(f"❌ Tests Failed: {tests_total - tests_passed}/{tests_total}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
