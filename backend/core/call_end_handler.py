"""
Call End Handler - Automatic Summary Generation
------------------------------------------------
Automatically generates and returns comprehensive call report when a call ends,
including:
1. Call Summary with Insights
2. Sentiment Analysis
3. Complete Transcripts
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class CallEndReport:
    """Complete call report generated at call end"""
    
    def __init__(
        self,
        room_id: str,
        call_summary: Dict[str, Any],
        sentiment_analysis: Dict[str, Any],
        transcripts: list,
        order_data: Optional[Dict[str, Any]] = None
    ):
        self.room_id = room_id
        self.call_summary = call_summary
        self.sentiment_analysis = sentiment_analysis
        self.transcripts = transcripts
        self.order_data = order_data
        self.generated_at = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "room_id": self.room_id,
            "generated_at": self.generated_at.isoformat(),
            "call_summary": self.call_summary,
            "sentiment_analysis": self.sentiment_analysis,
            "transcripts": self.transcripts,
            "order_data": self.order_data
        }


async def generate_call_end_report(
    room_id: str,
    db_service,
    summary_generator,
    manual_notes: Optional[str] = None
) -> CallEndReport:
    """
    Generate complete call report when call ends
    
    Returns:
    - Call Summary with insights
    - Sentiment Analysis aggregated data
    - Complete Transcripts
    - Order Data (if available)
    """
    
    try:
        logger.info(f"Generating call end report for room {room_id}")
        
        # 1. Get Transcripts
        transcripts_raw = await db_service.get_transcripts(room_id)
        transcripts = [
            {
                "id": t.get("id"),
                "role": t.get("role"),
                "message": t.get("message"),
                "timestamp": t.get("timestamp"),
                "created_at": t.get("created_at")
            } for t in transcripts_raw
        ]
        
        # 2. Get Sentiment Analysis Data
        sentiment_data_list = await db_service.get_sentiment_data(room_id)
        
        # Aggregate sentiment analysis
        sentiment_analysis = {
            "overall_sentiment": "neutral",
            "average_confidence": 0.5,
            "sentiment_journey": [],
            "final_sentiment": "neutral",
            "sentiment_shifts": 0,
            "engagement_metrics": {
                "average_engagement": 0.5,
                "average_satisfaction": 0.5,
                "purchase_intent": 0.3
            }
        }
        
        if sentiment_data_list:
            # Calculate averages
            confidences = [s.get("confidence", 0.5) for s in sentiment_data_list]
            engagements = [s.get("engagement", 0.5) for s in sentiment_data_list]
            satisfactions = [s.get("satisfaction", 0.5) for s in sentiment_data_list]
            purchase_intents = [s.get("purchase_intent", 0.3) for s in sentiment_data_list]
            
            sentiment_analysis = {
                "overall_sentiment": sentiment_data_list[-1].get("overall_sentiment", "neutral") if sentiment_data_list else "neutral",
                "average_confidence": round(sum(confidences) / len(confidences), 2) if confidences else 0.5,
                "sentiment_journey": [
                    {
                        "sequence": i + 1,
                        "sentiment": s.get("overall_sentiment", "neutral"),
                        "confidence": s.get("confidence", 0.5),
                        "timestamp": s.get("timestamp")
                    } for i, s in enumerate(sentiment_data_list)
                ],
                "final_sentiment": sentiment_data_list[-1].get("overall_sentiment", "neutral") if sentiment_data_list else "neutral",
                "sentiment_shifts": len([i for i in range(1, len(sentiment_data_list)) 
                                        if sentiment_data_list[i].get("overall_sentiment") != sentiment_data_list[i-1].get("overall_sentiment")]),
                "engagement_metrics": {
                    "average_engagement": round(sum(engagements) / len(engagements), 2) if engagements else 0.5,
                    "average_satisfaction": round(sum(satisfactions) / len(satisfactions), 2) if satisfactions else 0.5,
                    "average_purchase_intent": round(sum(purchase_intents) / len(purchase_intents), 2) if purchase_intents else 0.3,
                },
                "emotions_summary": sentiment_data_list[-1].get("emotions", {}) if sentiment_data_list else {}
            }
        
        # 3. Get Order Data
        order_doc = await db_service.get_order(room_id)
        order_data = None
        if order_doc:
            order_data = {
                "order_id": order_doc.get("order_id"),
                "customer_id": order_doc.get("customer_id"),
                "customer_name": order_doc.get("customer_name"),
                "book_title": order_doc.get("book_title"),
                "author": order_doc.get("author"),
                "genre": order_doc.get("genre"),
                "quantity": order_doc.get("quantity"),
                "unit_price": order_doc.get("unit_price"),
                "total_amount": order_doc.get("total_amount"),
                "payment_method": order_doc.get("payment_method"),
                "delivery_option": order_doc.get("delivery_option"),
                "delivery_address": order_doc.get("delivery_address"),
                "order_status": order_doc.get("order_status", "pending"),
                "order_date": order_doc.get("order_date"),
                "special_requests": order_doc.get("special_requests"),
            }
        
        # 4. Generate Call Summary
        summary = await summary_generator.generate_summary(
            room_id=room_id,
            transcripts=transcripts,
            order_data=order_data,
            sentiment_data=sentiment_data_list,
            manual_notes=manual_notes
        )
        
        # Store summary in database
        summary_dict = summary.to_dict()
        await db_service.store_call_summary(room_id, summary_dict)
        
        # 5. Create Complete Report
        report = CallEndReport(
            room_id=room_id,
            call_summary=summary_dict,
            sentiment_analysis=sentiment_analysis,
            transcripts=transcripts,
            order_data=order_data
        )
        
        logger.info(f"Call end report generated successfully for room {room_id}")
        return report
        
    except Exception as e:
        logger.error(f"Error generating call end report: {e}")
        raise
