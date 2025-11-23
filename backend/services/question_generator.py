"""
Dynamic Question/Objection Handling Generator
Milestone 3: Weeks 5-6 Module 3

This module implements:
1. Dynamic question prompt generator based on conversation flow
2. Objection handling techniques for sales conversations
3. Real-time conversation analysis for contextual responses
4. Integration with sentiment analysis for adaptive questioning
"""

import os
import logging
import json
import re
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum
import random

# LLM imports
import openai

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QuestionType(Enum):
    """Types of questions that can be generated"""
    OPEN_ENDED = "open_ended"
    CLOSED_ENDED = "closed_ended"
    PROBING = "probing"
    CLARIFYING = "clarifying"
    OBJECTION_HANDLING = "objection_handling"
    CLOSING = "closing"
    FOLLOW_UP = "follow_up"

class ConversationStage(Enum):
    """Stages of a sales conversation"""
    OPENING = "opening"
    DISCOVERY = "discovery"
    PRESENTATION = "presentation"
    OBJECTION_HANDLING = "objection_handling"
    CLOSING = "closing"
    FOLLOW_UP = "follow_up"

class ObjectionType(Enum):
    """Types of customer objections"""
    PRICE_OBJECTION = "price_objection"
    NEED_OBJECTION = "need_objection"
    TRUST_OBJECTION = "trust_objection"
    TIME_OBJECTION = "time_objection"
    AUTHORITY_OBJECTION = "authority_objection"
    COMPETITOR_OBJECTION = "competitor_objection"
    BUDGET_OBJECTION = "budget_objection"

@dataclass
class Question:
    """Question data structure"""
    question_id: str
    text: str
    question_type: QuestionType
    conversation_stage: ConversationStage
    context: str
    expected_response_type: str
    follow_up_questions: List[str] = None
    success_indicators: List[str] = None
    objection_handling: bool = False

@dataclass
class ObjectionResponse:
    """Objection handling response structure"""
    objection_type: ObjectionType
    response_text: str
    technique: str
    follow_up_questions: List[str]
    confidence_boosters: List[str]

@dataclass
class ConversationContext:
    """Current conversation context"""
    stage: ConversationStage
    customer_sentiment: str
    customer_engagement: float
    purchase_intent: float
    objection_level: float
    trust_level: float
    topics_discussed: List[str]
    questions_asked: List[str]
    customer_responses: List[str]
    current_topic: str
    conversation_duration: float  # in minutes

class DynamicQuestionGenerator:
    """
    Advanced question generation system with objection handling
    """
    
    def __init__(self):
        self.openai_client = None
        self.question_templates: Dict[ConversationStage, List[Question]] = {}
        self.objection_responses: Dict[ObjectionType, List[ObjectionResponse]] = {}
        self.conversation_contexts: Dict[str, ConversationContext] = {}
        
        self._initialize_openai()
        self._initialize_question_templates()
        self._initialize_objection_responses()
    
    def _initialize_openai(self):
        """Initialize OpenAI client for advanced question generation"""
        try:
            openai_api_key = os.getenv("OPENAI_API_KEY")
            if openai_api_key:
                self.openai_client = openai.AsyncOpenAI(api_key=openai_api_key)
                logger.info("OpenAI client initialized for question generation")
            else:
                logger.warning("OpenAI API key not found - using template-based questions only")
        except Exception as e:
            logger.error(f"Error initializing OpenAI: {e}")
    
    def _initialize_question_templates(self):
        """Initialize question templates for different conversation stages"""
        
        # Opening stage questions
        self.question_templates[ConversationStage.OPENING] = [
            Question(
                question_id="OPEN_001",
                text="Hello! I'm here to help you find the perfect book. What brings you in today?",
                question_type=QuestionType.OPEN_ENDED,
                conversation_stage=ConversationStage.OPENING,
                context="Initial greeting and discovery",
                expected_response_type="customer_need",
                follow_up_questions=["What type of books do you usually enjoy reading?"],
                success_indicators=["specific interest", "book mention", "genre preference"]
            ),
            Question(
                question_id="OPEN_002",
                text="Are you looking for something specific today, or would you like me to recommend some great books?",
                question_type=QuestionType.CLOSED_ENDED,
                conversation_stage=ConversationStage.OPENING,
                context="Directive opening",
                expected_response_type="yes_no_or_specific",
                follow_up_questions=["What genre interests you most?"]
            )
        ]
        
        # Discovery stage questions
        self.question_templates[ConversationStage.DISCOVERY] = [
            Question(
                question_id="DISC_001",
                text="What's your favorite genre of books?",
                question_type=QuestionType.OPEN_ENDED,
                conversation_stage=ConversationStage.DISCOVERY,
                context="Genre preference discovery",
                expected_response_type="genre_preference",
                follow_up_questions=["Who are some of your favorite authors in that genre?"]
            ),
            Question(
                question_id="DISC_002",
                text="Are you looking for fiction or non-fiction today?",
                question_type=QuestionType.CLOSED_ENDED,
                conversation_stage=ConversationStage.DISCOVERY,
                context="Fiction vs non-fiction preference",
                expected_response_type="fiction_or_nonfiction",
                follow_up_questions=["What topics interest you most in non-fiction?"]
            ),
            Question(
                question_id="DISC_003",
                text="What's the last book you read that you really enjoyed?",
                question_type=QuestionType.OPEN_ENDED,
                conversation_stage=ConversationStage.DISCOVERY,
                context="Reading history and preferences",
                expected_response_type="book_title_and_reason",
                follow_up_questions=["What did you like most about that book?"]
            ),
            Question(
                question_id="DISC_004",
                text="Are you looking for something light and entertaining, or more serious and thought-provoking?",
                question_type=QuestionType.CLOSED_ENDED,
                conversation_stage=ConversationStage.DISCOVERY,
                context="Reading mood and tone preference",
                expected_response_type="mood_preference",
                follow_up_questions=["What kind of stories usually capture your attention?"]
            )
        ]
        
        # Presentation stage questions
        self.question_templates[ConversationStage.PRESENTATION] = [
            Question(
                question_id="PRES_001",
                text="Based on what you've told me, I think you'd really enjoy this book. Would you like me to tell you more about it?",
                question_type=QuestionType.CLOSED_ENDED,
                conversation_stage=ConversationStage.PRESENTATION,
                context="Book recommendation presentation",
                expected_response_type="yes_no",
                follow_up_questions=["What aspects of the book would you like to know more about?"]
            ),
            Question(
                question_id="PRES_002",
                text="This book has received excellent reviews. Would you like to hear what other readers are saying about it?",
                question_type=QuestionType.CLOSED_ENDED,
                conversation_stage=ConversationStage.PRESENTATION,
                context="Social proof presentation",
                expected_response_type="yes_no",
                follow_up_questions=["Would you like to see some specific reviews?"]
            )
        ]
        
        # Objection handling stage questions
        self.question_templates[ConversationStage.OBJECTION_HANDLING] = [
            Question(
                question_id="OBJ_001",
                text="I understand your concern about the price. What if I could show you how this book provides value that far exceeds its cost?",
                question_type=QuestionType.OBJECTION_HANDLING,
                conversation_stage=ConversationStage.OBJECTION_HANDLING,
                context="Price objection handling",
                expected_response_type="objection_response",
                objection_handling=True
            ),
            Question(
                question_id="OBJ_002",
                text="That's a valid point. What specific aspects of the book are you unsure about?",
                question_type=QuestionType.PROBING,
                conversation_stage=ConversationStage.OBJECTION_HANDLING,
                context="Objection clarification",
                expected_response_type="specific_concerns",
                objection_handling=True
            )
        ]
        
        # Closing stage questions
        self.question_templates[ConversationStage.CLOSING] = [
            Question(
                question_id="CLOSE_001",
                text="This book seems like a perfect match for you. Would you like to take it home today?",
                question_type=QuestionType.CLOSING,
                conversation_stage=ConversationStage.CLOSING,
                context="Direct close",
                expected_response_type="yes_no",
                follow_up_questions=["What payment method would you prefer?"]
            ),
            Question(
                question_id="CLOSE_002",
                text="I can see you're really interested in this book. Shall we go ahead and get it for you?",
                question_type=QuestionType.CLOSING,
                conversation_stage=ConversationStage.CLOSING,
                context="Assumptive close",
                expected_response_type="yes_no_or_concern"
            )
        ]
    
    def _initialize_objection_responses(self):
        """Initialize objection handling responses"""
        
        # Price objection responses
        self.objection_responses[ObjectionType.PRICE_OBJECTION] = [
            ObjectionResponse(
                objection_type=ObjectionType.PRICE_OBJECTION,
                response_text="I understand price is important. Let me show you the value this book provides. It's not just about the price, but about the knowledge and enjoyment you'll get from reading it.",
                technique="Value justification",
                follow_up_questions=["What would you consider a fair price for a book that could change your perspective?"],
                confidence_boosters=["This book has helped thousands of readers", "The author is a recognized expert"]
            ),
            ObjectionResponse(
                objection_type=ObjectionType.PRICE_OBJECTION,
                response_text="I hear you on the price. What if I told you this book could save you money in the long run by teaching you valuable skills?",
                technique="ROI justification",
                follow_up_questions=["What's the most you've ever spent on something that changed your life?"],
                confidence_boosters=["Many readers say this book paid for itself within weeks"]
            )
        ]
        
        # Need objection responses
        self.objection_responses[ObjectionType.NEED_OBJECTION] = [
            ObjectionResponse(
                objection_type=ObjectionType.NEED_OBJECTION,
                response_text="I understand you might not see the immediate need. But based on what you've told me about your interests, this book could open up new possibilities you haven't considered.",
                technique="Need creation",
                follow_up_questions=["What if this book could help you discover something you didn't know you were looking for?"],
                confidence_boosters=["Many readers discover new passions through this book"]
            )
        ]
        
        # Trust objection responses
        self.objection_responses[ObjectionType.TRUST_OBJECTION] = [
            ObjectionResponse(
                objection_type=ObjectionType.TRUST_OBJECTION,
                response_text="I completely understand wanting to be sure about your purchase. This author has a proven track record and thousands of satisfied readers. Would you like to see some reviews?",
                technique="Social proof",
                follow_up_questions=["What would help you feel more confident about this choice?"],
                confidence_boosters=["The author has won multiple awards", "This is a bestseller"]
            )
        ]
        
        # Time objection responses
        self.objection_responses[ObjectionType.TIME_OBJECTION] = [
            ObjectionResponse(
                objection_type=ObjectionType.TIME_OBJECTION,
                response_text="I understand you're busy. This book is actually designed for busy people - it's easy to read in short sessions. What's your typical reading schedule?",
                technique="Time reframing",
                follow_up_questions=["How much time do you usually spend reading each week?"],
                confidence_boosters=["Many busy professionals love this book's format"]
            )
        ]
    
    async def generate_question(self, room_id: str, conversation_history: List[str], 
                              sentiment_data: Dict[str, Any] = None) -> Optional[Question]:
        """
        Generate the next appropriate question based on conversation context
        """
        try:
            # Get or create conversation context
            context = self.conversation_contexts.get(room_id)
            if not context:
                context = ConversationContext(
                    stage=ConversationStage.OPENING,
                    customer_sentiment="neutral",
                    customer_engagement=0.5,
                    purchase_intent=0.5,
                    objection_level=0.0,
                    trust_level=0.5,
                    topics_discussed=[],
                    questions_asked=[],
                    customer_responses=[],
                    current_topic="",
                    conversation_duration=0.0
                )
                self.conversation_contexts[room_id] = context
            
            # Update context with new information
            await self._update_conversation_context(context, conversation_history, sentiment_data)
            
            # Generate appropriate question
            if self.openai_client:
                question = await self._generate_ai_question(context, conversation_history)
            else:
                question = await self._generate_template_question(context)
            
            if question:
                # Update context with new question
                context.questions_asked.append(question.text)
                self.conversation_contexts[room_id] = context
            
            return question
            
        except Exception as e:
            logger.error(f"Error generating question: {e}")
            return None
    
    async def _update_conversation_context(self, context: ConversationContext, 
                                         conversation_history: List[str], 
                                         sentiment_data: Dict[str, Any]):
        """Update conversation context with new information"""
        
        # Update sentiment data
        if sentiment_data:
            context.customer_sentiment = sentiment_data.get("overall_sentiment", "neutral")
            context.customer_engagement = sentiment_data.get("engagement", 0.5)
            context.purchase_intent = sentiment_data.get("purchase_intent", 0.5)
            context.objection_level = sentiment_data.get("objection_level", 0.0)
            context.trust_level = sentiment_data.get("trust_level", 0.5)
        
        # Analyze conversation history for topics and responses
        recent_messages = conversation_history[-10:]  # Last 10 messages
        
        for message in recent_messages:
            # Extract topics discussed
            topics = self._extract_topics(message)
            context.topics_discussed.extend(topics)
            
            # Identify customer responses
            if not message.startswith("Assistant:") and not message.startswith("Agent:"):
                context.customer_responses.append(message)
        
        # Determine conversation stage based on context
        context.stage = self._determine_conversation_stage(context)
        
        # Update current topic
        if context.customer_responses:
            context.current_topic = self._extract_current_topic(context.customer_responses[-1])
    
    def _extract_topics(self, message: str) -> List[str]:
        """Extract topics from a message"""
        topics = []
        message_lower = message.lower()
        
        # Define topic keywords
        topic_keywords = {
            "fiction": ["fiction", "novel", "story", "character"],
            "non-fiction": ["non-fiction", "fact", "real", "true story"],
            "mystery": ["mystery", "thriller", "suspense", "crime"],
            "romance": ["romance", "love", "relationship", "romantic"],
            "business": ["business", "finance", "money", "investment"],
            "self-help": ["self-help", "motivation", "improvement", "personal development"],
            "price": ["price", "cost", "expensive", "cheap", "budget"],
            "author": ["author", "writer", "wrote"],
            "genre": ["genre", "type", "category", "kind"]
        }
        
        for topic, keywords in topic_keywords.items():
            if any(keyword in message_lower for keyword in keywords):
                topics.append(topic)
        
        return topics
    
    def _determine_conversation_stage(self, context: ConversationContext) -> ConversationStage:
        """Determine current conversation stage based on context"""
        
        # Check for objections
        if context.objection_level > 0.6:
            return ConversationStage.OBJECTION_HANDLING
        
        # Check for closing signals
        if (context.purchase_intent > 0.7 and 
            context.trust_level > 0.6 and 
            len(context.questions_asked) > 3):
            return ConversationStage.CLOSING
        
        # Check if we have enough discovery information
        if (len(context.topics_discussed) > 2 and 
            any(topic in context.topics_discussed for topic in ["genre", "author", "fiction", "non-fiction"])):
            return ConversationStage.PRESENTATION
        
        # Default to discovery if we don't have enough information
        if len(context.questions_asked) < 3:
            return ConversationStage.DISCOVERY
        
        return ConversationStage.PRESENTATION
    
    def _extract_current_topic(self, message: str) -> str:
        """Extract current topic from the latest customer response"""
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["price", "cost", "expensive", "cheap"]):
            return "price"
        elif any(word in message_lower for word in ["genre", "type", "fiction", "non-fiction"]):
            return "genre"
        elif any(word in message_lower for word in ["author", "writer"]):
            return "author"
        elif any(word in message_lower for word in ["buy", "purchase", "order"]):
            return "purchase"
        else:
            return "general"
    
    async def _generate_ai_question(self, context: ConversationContext, 
                                  conversation_history: List[str]) -> Optional[Question]:
        """Generate question using AI based on conversation context"""
        try:
            # Prepare conversation summary
            recent_history = conversation_history[-6:]  # Last 6 messages
            conversation_summary = "\n".join(recent_history)
            
            # Create AI prompt
            prompt = f"""
            You are a professional book sales assistant. Based on this conversation context, generate the next most appropriate question.
            
            Conversation Context:
            - Stage: {context.stage.value}
            - Customer Sentiment: {context.customer_sentiment}
            - Customer Engagement: {context.customer_engagement}
            - Purchase Intent: {context.purchase_intent}
            - Objection Level: {context.objection_level}
            - Trust Level: {context.trust_level}
            - Topics Discussed: {', '.join(context.topics_discussed)}
            - Questions Already Asked: {len(context.questions_asked)}
            
            Recent Conversation:
            {conversation_summary}
            
            Generate a single, natural question that:
            1. Is appropriate for the current conversation stage
            2. Addresses any objections or concerns
            3. Moves the conversation toward a sale
            4. Feels natural and conversational
            5. Is specific to the book sales context
            
            Return a JSON response:
            {{
                "question_text": "Your generated question here",
                "question_type": "open_ended|closed_ended|probing|clarifying|objection_handling|closing",
                "context": "Brief explanation of why this question is appropriate",
                "expected_response": "What kind of response you expect"
            }}
            """
            
            response = await self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert book sales assistant who asks the right questions at the right time."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
                temperature=0.7
            )
            
            content = response.choices[0].message.content
            ai_result = json.loads(content)
            
            # Create Question object
            question = Question(
                question_id=f"AI_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                text=ai_result.get("question_text", ""),
                question_type=QuestionType(ai_result.get("question_type", "open_ended")),
                conversation_stage=context.stage,
                context=ai_result.get("context", ""),
                expected_response_type=ai_result.get("expected_response", "general")
            )
            
            return question
            
        except Exception as e:
            logger.error(f"Error generating AI question: {e}")
            return None
    
    async def _generate_template_question(self, context: ConversationContext) -> Optional[Question]:
        """Generate question using predefined templates"""
        
        # Get available questions for current stage
        stage_questions = self.question_templates.get(context.stage, [])
        
        if not stage_questions:
            return None
        
        # Filter questions based on context
        suitable_questions = []
        
        for question in stage_questions:
            # Skip if we've already asked this question
            if question.text in context.questions_asked:
                continue
            
            # Check if question is suitable for current context
            if self._is_question_suitable(question, context):
                suitable_questions.append(question)
        
        if not suitable_questions:
            # If no suitable questions, return a generic one
            return Question(
                question_id="GENERIC_001",
                text="Tell me more about what you're looking for in a book.",
                question_type=QuestionType.OPEN_ENDED,
                conversation_stage=context.stage,
                context="Generic follow-up",
                expected_response_type="general"
            )
        
        # Return a random suitable question
        return random.choice(suitable_questions)
    
    def _is_question_suitable(self, question: Question, context: ConversationContext) -> bool:
        """Check if a question is suitable for the current context"""
        
        # Check objection handling
        if question.objection_handling and context.objection_level < 0.3:
            return False
        
        # Check conversation stage
        if question.conversation_stage != context.stage:
            return False
        
        # Check if we've already asked similar questions
        if any(similar in question.text.lower() for similar in context.questions_asked):
            return False
        
        return True
    
    async def handle_objection(self, objection_text: str, context: ConversationContext) -> Optional[ObjectionResponse]:
        """Handle customer objections with appropriate responses"""
        
        # Detect objection type
        objection_type = self._detect_objection_type(objection_text)
        
        if objection_type not in self.objection_responses:
            return None
        
        # Get appropriate responses
        responses = self.objection_responses[objection_type]
        
        # Select best response based on context
        best_response = self._select_best_objection_response(responses, context)
        
        return best_response
    
    def _detect_objection_type(self, objection_text: str) -> ObjectionType:
        """Detect the type of objection from customer text"""
        text_lower = objection_text.lower()
        
        # Price objections
        if any(phrase in text_lower for phrase in ["too expensive", "too much", "can't afford", "price", "cost"]):
            return ObjectionType.PRICE_OBJECTION
        
        # Need objections
        if any(phrase in text_lower for phrase in ["don't need", "not interested", "not looking for"]):
            return ObjectionType.NEED_OBJECTION
        
        # Trust objections
        if any(phrase in text_lower for phrase in ["not sure", "don't know", "unfamiliar", "never heard"]):
            return ObjectionType.TRUST_OBJECTION
        
        # Time objections
        if any(phrase in text_lower for phrase in ["no time", "busy", "later", "not now"]):
            return ObjectionType.TIME_OBJECTION
        
        # Authority objections
        if any(phrase in text_lower for phrase in ["need to ask", "check with", "think about"]):
            return ObjectionType.AUTHORITY_OBJECTION
        
        # Default to price objection
        return ObjectionType.PRICE_OBJECTION
    
    def _select_best_objection_response(self, responses: List[ObjectionResponse], 
                                      context: ConversationContext) -> ObjectionResponse:
        """Select the best objection response based on context"""
        
        # For now, return the first response
        # In a more sophisticated system, this would consider:
        # - Customer personality
        # - Previous responses
        # - Conversation history
        # - Success rates of different techniques
        
        return responses[0] if responses else None
    
    def get_conversation_context(self, room_id: str) -> Optional[ConversationContext]:
        """Get conversation context for a room"""
        return self.conversation_contexts.get(room_id)
    
    def clear_conversation_context(self, room_id: str):
        """Clear conversation context for a room"""
        if room_id in self.conversation_contexts:
            del self.conversation_contexts[room_id]

# Global question generator instance
question_generator = DynamicQuestionGenerator()
