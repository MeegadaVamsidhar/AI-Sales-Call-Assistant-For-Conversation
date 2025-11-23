"""Test Call End Report - Complete report with Summary, Sentiment, and Transcripts"""
import requests

BASE_URL = "http://localhost:8000"

def test_call_end_report(room_id: str):
    """Test complete call end report generation"""
    print(f"\n{'='*60}\nTesting Call End Report for: {room_id}\n{'='*60}\n")
    
    url = f"{BASE_URL}/api/call-end-report/{room_id}"
    response = requests.post(url)
    
    if response.status_code == 200:
        data = response.json()
        report = data["report"]
        
        print("✅ REPORT GENERATED!\n")
        
        # Summary
        summary = report["call_summary"]
        print(f"📋 CALL SUMMARY:")
        print(f"   Outcome: {summary['call_outcome']}")
        print(f"   Duration: {summary['call_duration_seconds']}s")
        print(f"   Satisfaction: {summary['customer_satisfaction']}")
        print(f"   Agent Quality: {summary['agent_response_quality']}")
        
        # Sentiment
        sentiment = report["sentiment_analysis"]
        print(f"\n😊 SENTIMENT ANALYSIS:")
        print(f"   Overall: {sentiment['overall_sentiment']}")
        print(f"   Journey Points: {len(sentiment['sentiment_journey'])}")
        print(f"   Engagement: {sentiment['engagement_metrics']['average_engagement']}")
        
        # Transcripts
        transcripts = report["transcripts"]
        print(f"\n💬 TRANSCRIPTS:")
        print(f"   Total Messages: {len(transcripts)}")
        print(f"   First message: {transcripts[0]['message'][:50]}...")
        
        print(f"\n{'='*60}\n✅ SUCCESS - All data returned!\n{'='*60}\n")
        return True
    else:
        print(f"❌ Error: {response.status_code}")
        return False

if __name__ == "__main__":
    test_room_id = input("Enter Room ID (or press Enter for 'test_room_001'): ").strip() or "test_room_001"
    test_call_end_report(test_room_id)
