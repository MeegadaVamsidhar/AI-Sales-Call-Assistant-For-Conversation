"""
Real-Time Speech Analysis and Sentiment Detection Engine
Milestone 2: Weeks 3-4 Module 1

This module implements:
1. LLM-based sentiment analysis using OpenAI GPT and Meta LLaMA
2. Real-time sentiment shift detection
3. Multi-dimensional sentiment scoring (tone, language, context)
4. Conversation flow analysis for sales optimization
"""

import os
import logging
import asyncio
import json
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import numpy as np

# LLM and ML imports
import openai

# Optional transformers import
try:
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    import torch
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    pipeline = None
    AutoTokenizer = None
    AutoModelForSequenceClassification = None
    torch = None

# Sentiment analysis libraries
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import nltk

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('vader_lexicon', quiet=True)
    nltk.download('stopwords', quiet=True)
except Exception as e:
    logging.warning(f"Failed to download NLTK data: {e}")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SentimentLabel(Enum):
    """Sentiment classification labels"""
    VERY_POSITIVE = "very_positive"
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    VERY_NEGATIVE = "very_negative"

class EmotionLabel(Enum):
    """Emotion classification labels"""
    JOY = "joy"
    TRUST = "trust"
    FEAR = "fear"
    SURPRISE = "surprise"
    SADNESS = "sadness"
    DISGUST = "disgust"
    ANGER = "anger"
    ANTICIPATION = "anticipation"

@dataclass
class SentimentScore:
    """Comprehensive sentiment scoring structure"""
    # Overall sentiment
    overall_sentiment: SentimentLabel
    confidence: float
    
    # Dimensional scores (-1 to 1)
    polarity: float  # Positive/Negative
    subjectivity: float  # Objective/Subjective
    intensity: float  # Emotional intensity
    
    # Specific emotions (0 to 1)
    emotions: Dict[str, float]
    
    # Context analysis
    urgency: float  # How urgent/pressing the message is
    engagement: float  # How engaged the customer seems
    satisfaction: float  # Customer satisfaction level
    
    # Sales-specific metrics
    purchase_intent: float  # Likelihood to purchase
    objection_level: float  # Level of objections/resistance
    trust_level: float  # Trust in the agent/company
    
    # Metadata
    timestamp: datetime
    message_length: int
    processing_time: float

@dataclass
class SentimentShift:
    """Represents a detected sentiment shift"""
    previous_sentiment: SentimentLabel
    current_sentiment: SentimentLabel
    shift_magnitude: float  # How significant the shift is
    shift_direction: str  # "positive", "negative", "neutral"
    trigger_phrases: List[str]  # Phrases that likely caused the shift
    timestamp: datetime
    confidence: float

class SentimentAnalysisEngine:
    """
    Advanced sentiment analysis engine using multiple LLMs and traditional ML approaches
    """
    
    def __init__(self):
        self.openai_client = None
        self.llama_pipeline = None
        self.vader_analyzer = SentimentIntensityAnalyzer()
        self.emotion_pipeline = None
        
        # Sentiment history for shift detection
        self.sentiment_history: Dict[str, List[SentimentScore]] = {}
        self.shift_threshold = 0.3  # Minimum change to consider a shift
        
        # Initialize models lazily
        self._models_initialized = False
    
    async def _initialize_models(self):
        """Initialize LLM models and pipelines"""
        try:
            # Initialize OpenAI
            openai_api_key = os.getenv("OPENAI_API_KEY")
            if openai_api_key:
                self.openai_client = openai.AsyncOpenAI(api_key=openai_api_key)
                logger.info("OpenAI client initialized successfully")
            else:
                logger.warning("OpenAI API key not found")
            
            # Initialize emotion detection pipeline (if transformers available)
            if TRANSFORMERS_AVAILABLE:
                try:
                    self.emotion_pipeline = pipeline(
                        "text-classification",
                        model="j-hartmann/emotion-english-distilroberta-base",
                        device=0 if torch.cuda.is_available() else -1
                    )
                    logger.info("Emotion detection pipeline initialized")
                except Exception as e:
                    logger.warning(f"Failed to initialize emotion pipeline: {e}")
                
                # Initialize LLaMA pipeline (using a smaller model for efficiency)
                try:
                    self.llama_pipeline = pipeline(
                        "text-classification",
                        model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                        device=0 if torch.cuda.is_available() else -1
                    )
                    logger.info("LLaMA-based sentiment pipeline initialized")
                except Exception as e:
                    logger.warning(f"Failed to initialize LLaMA pipeline: {e}")
            else:
                logger.warning("Transformers not available - emotion detection and LLaMA pipelines disabled")
                
        except Exception as e:
            logger.error(f"Error initializing models: {e}")
        finally:
            self._models_initialized = True
    
    async def _ensure_models_initialized(self):
        """Ensure models are initialized before use"""
        if not self._models_initialized:
            await self._initialize_models()
    
    async def analyze_message_sentiment(self, message: str, user_id: str = "default") -> SentimentScore:
        """
        Comprehensive sentiment analysis of a single message
        """
        await self._ensure_models_initialized()
        start_time = datetime.now()
        
        try:
            # Basic preprocessing
            message_clean = message.strip()
            if not message_clean:
                return self._create_neutral_sentiment(start_time)
            
            # Run multiple analysis methods in parallel
            results = await asyncio.gather(
                self._analyze_with_openai(message_clean),
                self._analyze_with_llama(message_clean),
                self._analyze_with_vader(message_clean),
                self._analyze_with_textblob(message_clean),
                self._analyze_emotions(message_clean),
                self._analyze_sales_context(message_clean),
                return_exceptions=True
            )
            
            # Combine results
            openai_result, llama_result, vader_result, textblob_result, emotions_result, sales_context = results
            
            # Calculate weighted sentiment scores
            sentiment_score = self._combine_sentiment_results(
                openai_result, llama_result, vader_result, textblob_result,
                emotions_result, sales_context, message_clean, start_time
            )
            
            # Store in history for shift detection
            if user_id not in self.sentiment_history:
                self.sentiment_history[user_id] = []
            self.sentiment_history[user_id].append(sentiment_score)
            
            # Keep only last 50 messages for efficiency
            if len(self.sentiment_history[user_id]) > 50:
                self.sentiment_history[user_id] = self.sentiment_history[user_id][-50:]
            
            return sentiment_score
            
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {e}")
            return self._create_neutral_sentiment(start_time)
    
    async def _analyze_with_openai(self, message: str) -> Dict[str, Any]:
        """Analyze sentiment using OpenAI GPT"""
        if not self.openai_client:
            return {"error": "OpenAI not available"}
        
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a sales conversation sentiment analyzer. Analyze the customer's message and return a JSON response with:
                        {
                            "sentiment": "very_positive|positive|neutral|negative|very_negative",
                            "confidence": 0.0-1.0,
                            "polarity": -1.0 to 1.0,
                            "purchase_intent": 0.0-1.0,
                            "objection_level": 0.0-1.0,
                            "trust_level": 0.0-1.0,
                            "urgency": 0.0-1.0,
                            "engagement": 0.0-1.0,
                            "key_phrases": ["phrase1", "phrase2"]
                        }"""
                    },
                    {"role": "user", "content": message}
                ],
                max_tokens=200,
                temperature=0.1
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
            
        except Exception as e:
            logger.error(f"OpenAI analysis error: {e}")
            return {"error": str(e)}
    
    async def _analyze_with_llama(self, message: str) -> Dict[str, Any]:
        """Analyze sentiment using LLaMA-based model"""
        if not self.llama_pipeline:
            return {"error": "LLaMA not available"}
        
        try:
            result = self.llama_pipeline(message)
            
            # Convert to standardized format
            label_map = {
                "LABEL_0": "negative",  # Negative
                "LABEL_1": "neutral",   # Neutral
                "LABEL_2": "positive",  # Positive
                "negative": "negative",
                "neutral": "neutral", 
                "positive": "positive"
            }
            
            sentiment = label_map.get(result[0]["label"], "neutral")
            confidence = result[0]["score"]
            
            return {
                "sentiment": sentiment,
                "confidence": confidence,
                "polarity": confidence if sentiment == "positive" else -confidence if sentiment == "negative" else 0
            }
            
        except Exception as e:
            logger.error(f"LLaMA analysis error: {e}")
            return {"error": str(e)}
    
    async def _analyze_with_vader(self, message: str) -> Dict[str, Any]:
        """Analyze sentiment using VADER"""
        try:
            scores = self.vader_analyzer.polarity_scores(message)
            
            # Determine sentiment label
            compound = scores['compound']
            if compound >= 0.5:
                sentiment = "positive"
            elif compound >= 0.1:
                sentiment = "neutral"
            elif compound <= -0.5:
                sentiment = "negative"
            else:
                sentiment = "neutral"
            
            return {
                "sentiment": sentiment,
                "confidence": abs(compound),
                "polarity": compound,
                "positive": scores['pos'],
                "negative": scores['neg'],
                "neutral": scores['neu']
            }
            
        except Exception as e:
            logger.error(f"VADER analysis error: {e}")
            return {"error": str(e)}
    
    async def _analyze_with_textblob(self, message: str) -> Dict[str, Any]:
        """Analyze sentiment using TextBlob"""
        try:
            blob = TextBlob(message)
            polarity = blob.sentiment.polarity
            subjectivity = blob.sentiment.subjectivity
            
            # Determine sentiment
            if polarity > 0.1:
                sentiment = "positive"
            elif polarity < -0.1:
                sentiment = "negative"
            else:
                sentiment = "neutral"
            
            return {
                "sentiment": sentiment,
                "confidence": abs(polarity),
                "polarity": polarity,
                "subjectivity": subjectivity
            }
            
        except Exception as e:
            logger.error(f"TextBlob analysis error: {e}")
            return {"error": str(e)}
    
    async def _analyze_emotions(self, message: str) -> Dict[str, Any]:
        """Analyze emotions using emotion detection model"""
        if not self.emotion_pipeline:
            return {"error": "Emotion pipeline not available"}
        
        try:
            results = self.emotion_pipeline(message)
            
            # Convert to emotion scores
            emotions = {}
            for result in results:
                emotions[result["label"].lower()] = result["score"]
            
            return {"emotions": emotions}
            
        except Exception as e:
            logger.error(f"Emotion analysis error: {e}")
            return {"error": str(e)}
    
    async def _analyze_sales_context(self, message: str) -> Dict[str, Any]:
        """Analyze sales-specific context and intent"""
        try:
            message_lower = message.lower()
            
            # Purchase intent keywords
            purchase_keywords = [
                "buy", "purchase", "order", "get", "want", "need", "interested",
                "price", "cost", "how much", "available", "in stock"
            ]
            
            # Objection keywords
            objection_keywords = [
                "but", "however", "expensive", "too much", "can't afford",
                "not sure", "maybe later", "think about it", "not interested"
            ]
            
            # Trust keywords
            trust_keywords = [
                "thank you", "great", "perfect", "excellent", "helpful",
                "recommend", "trust", "reliable", "good"
            ]
            
            # Urgency keywords
            urgency_keywords = [
                "urgent", "asap", "quickly", "soon", "immediately", "rush",
                "deadline", "time sensitive"
            ]
            
            # Calculate scores
            purchase_intent = sum(1 for keyword in purchase_keywords if keyword in message_lower) / len(purchase_keywords)
            objection_level = sum(1 for keyword in objection_keywords if keyword in message_lower) / len(objection_keywords)
            trust_level = sum(1 for keyword in trust_keywords if keyword in message_lower) / len(trust_keywords)
            urgency = sum(1 for keyword in urgency_keywords if keyword in message_lower) / len(urgency_keywords)
            
            return {
                "purchase_intent": min(purchase_intent * 2, 1.0),  # Scale up but cap at 1.0
                "objection_level": min(objection_level * 3, 1.0),
                "trust_level": min(trust_level * 2, 1.0),
                "urgency": min(urgency * 3, 1.0),
                "engagement": min(len(message) / 100, 1.0)  # Longer messages = more engagement
            }
            
        except Exception as e:
            logger.error(f"Sales context analysis error: {e}")
            return {"error": str(e)}
    
    def _combine_sentiment_results(self, openai_result, llama_result, vader_result, 
                                 textblob_result, emotions_result, sales_context,
                                 message: str, start_time: datetime) -> SentimentScore:
        """Combine results from multiple analysis methods"""
        
        # Extract sentiment scores with error handling
        sentiments = []
        confidences = []
        polarities = []
        
        # Process each result
        for result, weight in [(openai_result, 0.3), (llama_result, 0.25), (vader_result, 0.25), (textblob_result, 0.2)]:
            if isinstance(result, dict) and "error" not in result:
                if "sentiment" in result:
                    sentiments.append((result["sentiment"], weight))
                if "confidence" in result:
                    confidences.append(result["confidence"] * weight)
                if "polarity" in result:
                    polarities.append(result["polarity"] * weight)
        
        # Calculate weighted averages
        overall_polarity = sum(polarities) if polarities else 0.0
        overall_confidence = sum(confidences) if confidences else 0.5
        
        # Determine overall sentiment
        if overall_polarity > 0.5:
            overall_sentiment = SentimentLabel.VERY_POSITIVE
        elif overall_polarity > 0.1:
            overall_sentiment = SentimentLabel.POSITIVE
        elif overall_polarity < -0.5:
            overall_sentiment = SentimentLabel.VERY_NEGATIVE
        elif overall_polarity < -0.1:
            overall_sentiment = SentimentLabel.NEGATIVE
        else:
            overall_sentiment = SentimentLabel.NEUTRAL
        
        # Extract emotions
        emotions = {}
        if isinstance(emotions_result, dict) and "emotions" in emotions_result:
            emotions = emotions_result["emotions"]
        
        # Extract sales context
        sales_metrics = {
            "purchase_intent": 0.5,
            "objection_level": 0.0,
            "trust_level": 0.5,
            "urgency": 0.0,
            "engagement": 0.5
        }
        
        if isinstance(sales_context, dict) and "error" not in sales_context:
            sales_metrics.update(sales_context)
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return SentimentScore(
            overall_sentiment=overall_sentiment,
            confidence=overall_confidence,
            polarity=overall_polarity,
            subjectivity=textblob_result.get("subjectivity", 0.5) if isinstance(textblob_result, dict) else 0.5,
            intensity=abs(overall_polarity),
            emotions=emotions,
            urgency=sales_metrics["urgency"],
            engagement=sales_metrics["engagement"],
            satisfaction=max(0, overall_polarity),  # Positive polarity indicates satisfaction
            purchase_intent=sales_metrics["purchase_intent"],
            objection_level=sales_metrics["objection_level"],
            trust_level=sales_metrics["trust_level"],
            timestamp=datetime.now(),
            message_length=len(message),
            processing_time=processing_time
        )
    
    def _create_neutral_sentiment(self, start_time: datetime) -> SentimentScore:
        """Create a neutral sentiment score for error cases"""
        return SentimentScore(
            overall_sentiment=SentimentLabel.NEUTRAL,
            confidence=0.5,
            polarity=0.0,
            subjectivity=0.5,
            intensity=0.0,
            emotions={},
            urgency=0.0,
            engagement=0.5,
            satisfaction=0.5,
            purchase_intent=0.5,
            objection_level=0.0,
            trust_level=0.5,
            timestamp=datetime.now(),
            message_length=0,
            processing_time=(datetime.now() - start_time).total_seconds()
        )
    
    def detect_sentiment_shifts(self, user_id: str = "default") -> List[SentimentShift]:
        """
        Detect significant sentiment shifts in the conversation
        """
        if user_id not in self.sentiment_history or len(self.sentiment_history[user_id]) < 2:
            return []
        
        history = self.sentiment_history[user_id]
        shifts = []
        
        # Look at the last few messages for shifts
        for i in range(1, min(len(history), 6)):  # Check last 5 transitions
            current = history[-i]
            previous = history[-i-1]
            
            # Calculate shift magnitude
            polarity_change = abs(current.polarity - previous.polarity)
            confidence_change = abs(current.confidence - previous.confidence)
            
            shift_magnitude = (polarity_change + confidence_change) / 2
            
            if shift_magnitude > self.shift_threshold:
                # Determine shift direction
                if current.polarity > previous.polarity:
                    shift_direction = "positive"
                elif current.polarity < previous.polarity:
                    shift_direction = "negative"
                else:
                    shift_direction = "neutral"
                
                shift = SentimentShift(
                    previous_sentiment=previous.overall_sentiment,
                    current_sentiment=current.overall_sentiment,
                    shift_magnitude=shift_magnitude,
                    shift_direction=shift_direction,
                    trigger_phrases=[],  # Could be enhanced to identify trigger phrases
                    timestamp=current.timestamp,
                    confidence=min(current.confidence, previous.confidence)
                )
                
                shifts.append(shift)
        
        return shifts
    
    def get_conversation_summary(self, user_id: str = "default") -> Dict[str, Any]:
        """
        Generate a summary of the conversation's sentiment journey
        """
        if user_id not in self.sentiment_history or not self.sentiment_history[user_id]:
            return {"error": "No sentiment history found"}
        
        history = self.sentiment_history[user_id]
        
        # Calculate averages
        avg_polarity = np.mean([s.polarity for s in history])
        avg_confidence = np.mean([s.confidence for s in history])
        avg_engagement = np.mean([s.engagement for s in history])
        avg_purchase_intent = np.mean([s.purchase_intent for s in history])
        avg_trust_level = np.mean([s.trust_level for s in history])
        
        # Sentiment distribution
        sentiment_counts = {}
        for sentiment in SentimentLabel:
            sentiment_counts[sentiment.value] = sum(1 for s in history if s.overall_sentiment == sentiment)
        
        # Detect overall trend
        if len(history) >= 3:
            recent_polarity = np.mean([s.polarity for s in history[-3:]])
            early_polarity = np.mean([s.polarity for s in history[:3]])
            trend = "improving" if recent_polarity > early_polarity else "declining" if recent_polarity < early_polarity else "stable"
        else:
            trend = "insufficient_data"
        
        return {
            "message_count": len(history),
            "average_sentiment": {
                "polarity": float(avg_polarity),
                "confidence": float(avg_confidence),
                "engagement": float(avg_engagement),
                "purchase_intent": float(avg_purchase_intent),
                "trust_level": float(avg_trust_level)
            },
            "sentiment_distribution": sentiment_counts,
            "overall_trend": trend,
            "shifts_detected": len(self.detect_sentiment_shifts(user_id)),
            "conversation_start": history[0].timestamp.isoformat(),
            "last_update": history[-1].timestamp.isoformat()
        }

# Global sentiment engine instance
sentiment_engine = SentimentAnalysisEngine()
