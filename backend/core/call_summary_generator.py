"""
Call Summary & Insight Generation Module
-----------------------------------------
Automatically generates post-call summaries with actionable insights
for continuous improvement.

Features:
- Extracts key points from call transcripts
- Identifies customer objections and concerns
- Tracks product/book interests
- Analyzes conversation flow and outcomes
- Provides actionable recommendations for improvement
"""

import logging
from typing import List, Dict, Optional, Any
from datetime import datetime
from collections import Counter
import re

logger = logging.getLogger(__name__)


class CallSummary:
    """Data model for call summary"""
    def __init__(
        self,
        summary_id: str,
        room_id: str,
        call_duration_seconds: float,
        total_messages: int,
        customer_messages: int,
        agent_messages: int,
        
        # Key Information
        customer_name: Optional[str],
        customer_contact: Optional[str],
        
        # Call Outcome
        call_outcome: str,  # success, partial_success, no_sale, information_only
        order_placed: bool,
        order_value: Optional[float],
        
        # Conversation Summary
        conversation_summary: str,
        key_topics: List[str],
        
        # Product Interest
        books_discussed: List[Dict[str, str]],
        genres_interested: List[str],
        authors_mentioned: List[str],
        
        # Objections & Concerns
        objections_raised: List[Dict[str, str]],
        concerns_addressed: List[Dict[str, str]],
        unresolved_concerns: List[str],
        
        # Sentiment & Engagement
        overall_sentiment: str,
        sentiment_journey: List[Dict[str, Any]],
        engagement_level: str,  # high, medium, low
        customer_satisfaction: Optional[float],
        
        # Agent Performance
        agent_response_quality: str,  # excellent, good, needs_improvement
        recommendations_made: int,
        objection_handling_score: float,
        closing_effectiveness: str,
        
        # Actionable Insights
        strengths: List[str],
        improvement_areas: List[str],
        follow_up_actions: List[str],
        coaching_points: List[str],
        
        # Metadata
        generated_at: datetime,
        call_timestamp: Optional[datetime] = None,
        manual_notes: Optional[str] = None,
    ):
        self.summary_id = summary_id
        self.room_id = room_id
        self.call_duration_seconds = call_duration_seconds
        self.total_messages = total_messages
        self.customer_messages = customer_messages
        self.agent_messages = agent_messages
        
        self.customer_name = customer_name
        self.customer_contact = customer_contact
        
        self.call_outcome = call_outcome
        self.order_placed = order_placed
        self.order_value = order_value
        
        self.conversation_summary = conversation_summary
        self.key_topics = key_topics
        
        self.books_discussed = books_discussed
        self.genres_interested = genres_interested
        self.authors_mentioned = authors_mentioned
        
        self.objections_raised = objections_raised
        self.concerns_addressed = concerns_addressed
        self.unresolved_concerns = unresolved_concerns
        
        self.overall_sentiment = overall_sentiment
        self.sentiment_journey = sentiment_journey
        self.engagement_level = engagement_level
        self.customer_satisfaction = customer_satisfaction
        
        self.agent_response_quality = agent_response_quality
        self.recommendations_made = recommendations_made
        self.objection_handling_score = objection_handling_score
        self.closing_effectiveness = closing_effectiveness
        
        self.strengths = strengths
        self.improvement_areas = improvement_areas
        self.follow_up_actions = follow_up_actions
        self.coaching_points = coaching_points
        
        self.generated_at = generated_at
        self.call_timestamp = call_timestamp
        self.manual_notes = manual_notes
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage/API response"""
        return {
            "summary_id": self.summary_id,
            "room_id": self.room_id,
            "call_duration_seconds": self.call_duration_seconds,
            "total_messages": self.total_messages,
            "customer_messages": self.customer_messages,
            "agent_messages": self.agent_messages,
            "customer_name": self.customer_name,
            "customer_contact": self.customer_contact,
            "call_outcome": self.call_outcome,
            "order_placed": self.order_placed,
            "order_value": self.order_value,
            "conversation_summary": self.conversation_summary,
            "key_topics": self.key_topics,
            "books_discussed": self.books_discussed,
            "genres_interested": self.genres_interested,
            "authors_mentioned": self.authors_mentioned,
            "objections_raised": self.objections_raised,
            "concerns_addressed": self.concerns_addressed,
            "unresolved_concerns": self.unresolved_concerns,
            "overall_sentiment": self.overall_sentiment,
            "sentiment_journey": self.sentiment_journey,
            "engagement_level": self.engagement_level,
            "customer_satisfaction": self.customer_satisfaction,
            "agent_response_quality": self.agent_response_quality,
            "recommendations_made": self.recommendations_made,
            "objection_handling_score": self.objection_handling_score,
            "closing_effectiveness": self.closing_effectiveness,
            "strengths": self.strengths,
            "improvement_areas": self.improvement_areas,
            "follow_up_actions": self.follow_up_actions,
            "coaching_points": self.coaching_points,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None,
            "call_timestamp": self.call_timestamp.isoformat() if self.call_timestamp else None,
            "manual_notes": self.manual_notes,
        }


class CallSummaryGenerator:
    """Generates comprehensive call summaries with insights"""
    
    def __init__(self):
        self.objection_keywords = [
            "expensive", "cost", "price", "afford", "budget",
            "not sure", "don't know", "maybe", "think about",
            "later", "busy", "no time", "already have",
            "don't need", "not interested", "concern", "worried"
        ]
        
        self.positive_keywords = [
            "love", "great", "perfect", "excellent", "interested",
            "yes", "definitely", "sure", "sounds good", "like",
            "want", "need", "looking for", "excited", "amazing"
        ]
        
        self.book_genres = [
            "fiction", "non-fiction", "mystery", "thriller", "romance",
            "sci-fi", "science fiction", "fantasy", "biography", "history",
            "self-help", "business", "children", "young adult", "horror",
            "poetry", "drama", "adventure", "crime"
        ]
    
    async def generate_summary(
        self,
        room_id: str,
        transcripts: List[Dict[str, Any]],
        order_data: Optional[Dict[str, Any]] = None,
        sentiment_data: Optional[List[Dict[str, Any]]] = None,
        manual_notes: Optional[str] = None
    ) -> CallSummary:
        """Generate comprehensive call summary from transcripts and related data"""
        
        try:
            import uuid
            
            # Generate summary ID
            summary_id = f"CS-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
            
            # Calculate basic metrics
            total_messages = len(transcripts)
            customer_messages = [t for t in transcripts if t.get("role") == "user"]
            agent_messages = [t for t in transcripts if t.get("role") == "assistant"]
            
            # Calculate call duration
            call_duration = 0
            if transcripts:
                first_timestamp = transcripts[0].get("timestamp", 0)
                last_timestamp = transcripts[-1].get("timestamp", 0)
                call_duration = last_timestamp - first_timestamp
            
            # Extract customer information
            customer_name = order_data.get("customer_name") if order_data else None
            customer_contact = order_data.get("customer_id") if order_data else None
            
            # Analyze call outcome
            order_placed = False
            order_value = None
            call_outcome = "information_only"
            
            if order_data and order_data.get("order_status") not in ["draft", None]:
                order_placed = True
                order_value = order_data.get("total_amount")
                call_outcome = "success"
            elif order_data and order_data.get("book_title"):
                call_outcome = "partial_success"
            
            # Generate all analysis components
            conversation_summary = self._generate_conversation_summary(transcripts)
            key_topics = self._extract_key_topics(transcripts)
            books_discussed = self._extract_books_discussed(transcripts)
            genres_interested = self._extract_genres(transcripts)
            authors_mentioned = self._extract_authors(transcripts)
            objections_raised = self._extract_objections(customer_messages)
            concerns_addressed = self._identify_addressed_concerns(transcripts, objections_raised)
            unresolved_concerns = self._identify_unresolved_concerns(objections_raised, concerns_addressed)
            overall_sentiment = self._calculate_overall_sentiment(sentiment_data)
            sentiment_journey = self._create_sentiment_journey(sentiment_data)
            engagement_level = self._calculate_engagement_level(transcripts, sentiment_data)
            customer_satisfaction = self._estimate_satisfaction(sentiment_data, call_outcome)
            agent_response_quality = self._evaluate_agent_responses(agent_messages, objections_raised)
            recommendations_made = self._count_recommendations(agent_messages)
            objection_handling_score = self._score_objection_handling(objections_raised, concerns_addressed)
            closing_effectiveness = self._evaluate_closing(transcripts, call_outcome)
            strengths = self._identify_strengths(agent_messages, recommendations_made, objection_handling_score, overall_sentiment, call_outcome)
            improvement_areas = self._identify_improvement_areas(agent_messages, objections_raised, concerns_addressed, engagement_level, call_outcome)
            follow_up_actions = self._generate_follow_up_actions(call_outcome, unresolved_concerns, customer_name, books_discussed)
            coaching_points = self._generate_coaching_points(improvement_areas, objection_handling_score, closing_effectiveness)
            
            call_timestamp = None
            if transcripts and transcripts[0].get("timestamp"):
                call_timestamp = datetime.fromtimestamp(transcripts[0].get("timestamp"))
            
            # Create call summary
            summary = CallSummary(
                summary_id=summary_id,
                room_id=room_id,
                call_duration_seconds=call_duration,
                total_messages=total_messages,
                customer_messages=len(customer_messages),
                agent_messages=len(agent_messages),
                customer_name=customer_name,
                customer_contact=customer_contact,
                call_outcome=call_outcome,
                order_placed=order_placed,
                order_value=order_value,
                conversation_summary=conversation_summary,
                key_topics=key_topics,
                books_discussed=books_discussed,
                genres_interested=genres_interested,
                authors_mentioned=authors_mentioned,
                objections_raised=objections_raised,
                concerns_addressed=concerns_addressed,
                unresolved_concerns=unresolved_concerns,
                overall_sentiment=overall_sentiment,
                sentiment_journey=sentiment_journey,
                engagement_level=engagement_level,
                customer_satisfaction=customer_satisfaction,
                agent_response_quality=agent_response_quality,
                recommendations_made=recommendations_made,
                objection_handling_score=objection_handling_score,
                closing_effectiveness=closing_effectiveness,
                strengths=strengths,
                improvement_areas=improvement_areas,
                follow_up_actions=follow_up_actions,
                coaching_points=coaching_points,
                generated_at=datetime.utcnow(),
                call_timestamp=call_timestamp,
                manual_notes=manual_notes
            )
            
            logger.info(f"Generated call summary {summary_id} for room {room_id}")
            return summary
            
        except Exception as e:
            logger.error(f"Error generating call summary: {e}")
            raise
    
    def _generate_conversation_summary(self, transcripts: List[Dict[str, Any]]) -> str:
        """Generate a brief summary of the conversation"""
        if not transcripts:
            return "No conversation data available."
        
        questions_asked = sum(1 for t in transcripts if "?" in t.get("message", ""))
        recommendations = sum(1 for t in transcripts if t.get("role") == "assistant" and 
                            any(word in t.get("message", "").lower() for word in ["recommend", "suggest", "might like"]))
        
        summary = f"The call consisted of {len(transcripts)} message exchanges. "
        summary += f"The agent asked {questions_asked} questions and made {recommendations} book recommendations."
        
        return summary
    
    def _extract_key_topics(self, transcripts: List[Dict[str, Any]]) -> List[str]:
        """Extract key topics discussed"""
        topics = []
        all_text = " ".join([t.get("message", "").lower() for t in transcripts])
        
        if any(word in all_text for word in ["price", "cost", "payment"]):
            topics.append("Pricing and Payment")
        if any(word in all_text for word in ["delivery", "shipping"]):
            topics.append("Delivery Options")
        if any(word in all_text for word in ["recommend", "suggest"]):
            topics.append("Book Recommendations")
        if any(word in all_text for word in ["genre", "type of book"]):
            topics.append("Genre Preferences")
        if any(word in all_text for word in ["author", "written by"]):
            topics.append("Author Preferences")
        if any(word in all_text for word in ["order", "buy", "purchase"]):
            topics.append("Order Placement")
        
        return topics if topics else ["General Inquiry"]
    
    def _extract_books_discussed(self, transcripts: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Extract books discussed"""
        books = []
        for transcript in transcripts:
            message = transcript.get("message", "")
            quoted_titles = re.findall(r'["""\']([\w\s:,\-\']+)["""\']', message)
            for title in quoted_titles:
                if len(title) > 3:
                    books.append({
                        "title": title.strip(),
                        "mentioned_by": transcript.get("role", "unknown"),
                        "context": "mentioned in conversation"
                    })
        
        seen = set()
        unique_books = []
        for book in books:
            if book["title"].lower() not in seen:
                seen.add(book["title"].lower())
                unique_books.append(book)
        
        return unique_books[:10]
    
    def _extract_genres(self, transcripts: List[Dict[str, Any]]) -> List[str]:
        """Extract genres mentioned"""
        genres_found = []
        all_text = " ".join([t.get("message", "").lower() for t in transcripts])
        
        for genre in self.book_genres:
            if genre in all_text:
                genres_found.append(genre.title())
        
        return list(set(genres_found))
    
    def _extract_authors(self, transcripts: List[Dict[str, Any]]) -> List[str]:
        """Extract authors mentioned"""
        authors = []
        for transcript in transcripts:
            message = transcript.get("message", "")
            author_matches = re.findall(r'by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})', message)
            authors.extend(author_matches)
        
        return list(set(authors))[:10]
    
    def _extract_objections(self, customer_messages: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Extract customer objections"""
        objections = []
        for msg in customer_messages:
            message = msg.get("message", "").lower()
            for keyword in self.objection_keywords:
                if keyword in message:
                    objections.append({
                        "type": self._categorize_objection(keyword),
                        "keyword": keyword,
                        "message": msg.get("message", "")[:200],
                        "timestamp": msg.get("timestamp")
                    })
                    break
        return objections
    
    def _categorize_objection(self, keyword: str) -> str:
        """Categorize objection type"""
        if keyword in ["expensive", "cost", "price", "afford", "budget"]:
            return "price"
        elif keyword in ["not sure", "don't know", "maybe", "think about"]:
            return "uncertainty"
        elif keyword in ["later", "busy", "no time"]:
            return "timing"
        elif keyword in ["already have", "don't need", "not interested"]:
            return "need"
        return "general_concern"
    
    def _identify_addressed_concerns(self, all_transcripts, objections) -> List[Dict[str, str]]:
        """Identify addressed objections"""
        addressed = []
        for objection in objections:
            objection_idx = next((i for i, t in enumerate(all_transcripts) 
                                if t.get("message") == objection.get("message")), -1)
            
            if objection_idx >= 0 and objection_idx + 1 < len(all_transcripts):
                agent_response = all_transcripts[objection_idx + 1]
                if agent_response.get("role") == "assistant":
                    addressed.append({
                        "objection_type": objection.get("type"),
                        "objection": objection.get("message")[:100],
                        "response": agent_response.get("message", "")[:200],
                        "addressed": True
                    })
        return addressed
    
    def _identify_unresolved_concerns(self, objections, addressed) -> List[str]:
        """Identify unresolved concerns"""
        addressed_types = {a.get("objection_type") for a in addressed}
        unresolved = []
        for objection in objections:
            if objection.get("type") not in addressed_types:
                unresolved.append(f"{objection.get('type')}: {objection.get('keyword')}")
        return list(set(unresolved))
    
    def _calculate_overall_sentiment(self, sentiment_data) -> str:
        """Calculate overall sentiment"""
        if not sentiment_data or not isinstance(sentiment_data, list):
            return "neutral"
        if sentiment_data:
            latest = sentiment_data[-1]
            return latest.get("overall_sentiment", "neutral")
        return "neutral"
    
    def _create_sentiment_journey(self, sentiment_data) -> List[Dict[str, Any]]:
        """Create sentiment journey"""
        if not sentiment_data or not isinstance(sentiment_data, list):
            return []
        return [{"sequence": i+1, "sentiment": s.get("overall_sentiment", "neutral"),
                 "confidence": s.get("confidence", 0)} for i, s in enumerate(sentiment_data)]
    
    def _calculate_engagement_level(self, transcripts, sentiment_data) -> str:
        """Calculate engagement level"""
        customer_msgs = [t for t in transcripts if t.get("role") == "user"]
        if len(customer_msgs) > 8:
            return "high"
        elif len(customer_msgs) > 4:
            return "medium"
        return "low"
    
    def _estimate_satisfaction(self, sentiment_data, call_outcome) -> Optional[float]:
        """Estimate satisfaction"""
        if call_outcome == "success":
            return 0.8
        elif call_outcome == "partial_success":
            return 0.6
        return 0.5
    
    def _evaluate_agent_responses(self, agent_messages, objections) -> str:
        """Evaluate agent response quality"""
        if not agent_messages:
            return "needs_improvement"
        helpful_keywords = ["recommend", "suggest", "help", "understand"]
        helpful = sum(1 for m in agent_messages if any(k in m.get("message", "").lower() for k in helpful_keywords))
        ratio = helpful / len(agent_messages) if agent_messages else 0
        return "excellent" if ratio > 0.7 else ("good" if ratio > 0.5 else "needs_improvement")
    
    def _count_recommendations(self, agent_messages) -> int:
        """Count recommendations"""
        keywords = ["recommend", "suggest", "might like"]
        return sum(1 for m in agent_messages if any(k in m.get("message", "").lower() for k in keywords))
    
    def _score_objection_handling(self, objections, addressed) -> float:
        """Score objection handling"""
        if not objections:
            return 1.0
        return round(len(addressed) / len(objections), 2) if objections else 0.0
    
    def _evaluate_closing(self, transcripts, call_outcome) -> str:
        """Evaluate closing effectiveness"""
        if call_outcome == "success":
            return "strong"
        return "moderate" if call_outcome == "partial_success" else "weak"
    
    def _identify_strengths(self, agent_messages, recommendations_made, objection_handling_score, overall_sentiment, call_outcome) -> List[str]:
        """Identify strengths"""
        strengths = []
        if recommendations_made >= 3:
            strengths.append(f"Made {recommendations_made} personalized book recommendations")
        if objection_handling_score >= 0.8:
            strengths.append("Effectively addressed customer concerns")
        if overall_sentiment in ["positive", "very_positive"]:
            strengths.append("Maintained positive customer sentiment")
        if call_outcome == "success":
            strengths.append("Successfully closed the sale")
        return strengths if strengths else ["Completed customer interaction"]
    
    def _identify_improvement_areas(self, agent_messages, objections, addressed, engagement_level, call_outcome) -> List[str]:
        """Identify improvement areas"""
        improvements = []
        if len(objections) > len(addressed):
            improvements.append("Improve objection handling")
        if engagement_level == "low":
            improvements.append("Increase customer engagement")
        if call_outcome == "information_only":
            improvements.append("Work on closing techniques")
        return improvements if improvements else ["Maintain current performance"]
    
    def _generate_follow_up_actions(self, call_outcome, unresolved_concerns, customer_name, books_discussed) -> List[str]:
        """Generate follow-up actions"""
        actions = []
        if unresolved_concerns:
            actions.append("Follow up on unresolved customer concerns")
        if call_outcome == "partial_success":
            actions.append("Send follow-up email with personalized book recommendations")
        if books_discussed and not call_outcome == "success":
            actions.append("Send information about discussed books")
        return actions if actions else ["No immediate follow-up required"]
    
    def _generate_coaching_points(self, improvement_areas, objection_handling_score, closing_effectiveness) -> List[str]:
        """Generate coaching points"""
        points = []
        if objection_handling_score < 0.7:
            points.append("Practice objection handling techniques")
        if closing_effectiveness == "weak":
            points.append("Work on closing skills and asking for the order")
        if improvement_areas:
            points.append(f"Focus on: {', '.join(improvement_areas[:2])}")
        return points if points else ["Continue current performance"]


# Create singleton instance
summary_generator = CallSummaryGenerator()
