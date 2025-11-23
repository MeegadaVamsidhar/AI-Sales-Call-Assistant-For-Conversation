'use client';

import React, { useState, useEffect } from 'react';
import { Brain, MessageSquare, RefreshCw, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useRoomContext } from '@livekit/components-react';

interface Question {
  question_id: string;
  text: string;
  question_type: string;
  conversation_stage: string;
  context: string;
  expected_response_type: string;
  follow_up_questions: string[];
  success_indicators: string[];
  objection_handling: boolean;
}

interface ConversationContext {
  stage: string;
  customer_sentiment: string;
  customer_engagement: number;
  purchase_intent: number;
  objection_level: number;
  trust_level: number;
  topics_discussed: string[];
  questions_asked_count: number;
  customer_responses_count: number;
  current_topic: string;
  conversation_duration: number;
}

interface QuestionGeneratorProps {
  conversationHistory: string[];
  sentimentData?: any;
  onQuestionSelect?: (question: Question) => void;
}

export const QuestionGenerator: React.FC<QuestionGeneratorProps> = ({
  conversationHistory,
  sentimentData,
  onQuestionSelect
}) => {
  const room = useRoomContext();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [conversationContext, setConversationContext] = useState<ConversationContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');

  const roomId = (room as any)?.name || (room as any)?.room?.name || 'unknown-room';

  const generateQuestion = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      
      const response = await fetch(`${backendUrl}/questions/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: roomId,
          conversation_history: conversationHistory,
          sentiment_data: sentimentData
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate question');
      }
      
      const data = await response.json();
      
      if (data.question) {
        setCurrentQuestion(data.question);
      } else {
        setError(data.message || 'No question generated');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate question');
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationContext = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      
      const response = await fetch(`${backendUrl}/questions/context/${roomId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversation context');
      }
      
      const data = await response.json();
      
      if (data.context) {
        setConversationContext(data.context);
      }
    } catch (err) {
      console.error('Failed to fetch conversation context:', err);
    }
  };

  const handleObjection = async (objectionText: string) => {
    if (!objectionText.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      
      const response = await fetch(`${backendUrl}/questions/handle-objection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: roomId,
          objection_text: objectionText
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to handle objection');
      }
      
      const data = await response.json();
      
      if (data.response) {
        // Create a question object from the objection response
        const objectionQuestion: Question = {
          question_id: `objection_${Date.now()}`,
          text: data.response.response_text,
          question_type: 'objection_handling',
          conversation_stage: 'objection_handling',
          context: `Handling ${data.response.objection_type} objection`,
          expected_response_type: 'objection_response',
          follow_up_questions: data.response.follow_up_questions || [],
          success_indicators: data.response.confidence_boosters || [],
          objection_handling: true
        };
        
        setCurrentQuestion(objectionQuestion);
      } else {
        setError(data.message || 'No response generated for objection');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to handle objection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversationContext();
  }, [roomId]);

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'open_ended': return 'bg-blue-100 text-blue-800';
      case 'closed_ended': return 'bg-green-100 text-green-800';
      case 'probing': return 'bg-purple-100 text-purple-800';
      case 'clarifying': return 'bg-yellow-100 text-yellow-800';
      case 'objection_handling': return 'bg-red-100 text-red-800';
      case 'closing': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'opening': return 'bg-green-100 text-green-800';
      case 'discovery': return 'bg-blue-100 text-blue-800';
      case 'presentation': return 'bg-purple-100 text-purple-800';
      case 'objection_handling': return 'bg-red-100 text-red-800';
      case 'closing': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'neutral': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">AI Question Generator</h3>
        </div>
        <Button 
          onClick={generateQuestion} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Generate
        </Button>
      </div>

      {/* Conversation Context */}
      {conversationContext && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Conversation Context</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Stage:</span>
                <Badge className={`ml-2 ${getStageColor(conversationContext.stage)}`}>
                  {conversationContext.stage}
                </Badge>
              </div>
              <div>
                <span className="text-gray-500">Sentiment:</span>
                <span className={`ml-2 font-medium ${getSentimentColor(conversationContext.customer_sentiment)}`}>
                  {conversationContext.customer_sentiment}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Engagement:</span>
                <span className="ml-2 font-medium">
                  {Math.round(conversationContext.customer_engagement * 100)}%
                </span>
              </div>
              <div>
                <span className="text-gray-500">Purchase Intent:</span>
                <span className="ml-2 font-medium">
                  {Math.round(conversationContext.purchase_intent * 100)}%
                </span>
              </div>
            </div>
            
            {conversationContext.topics_discussed.length > 0 && (
              <div className="mt-3">
                <span className="text-gray-500 text-sm">Topics:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {conversationContext.topics_discussed.map((topic, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Question */}
      {currentQuestion && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Generated Question</CardTitle>
              <div className="flex space-x-2">
                <Badge className={getQuestionTypeColor(currentQuestion.question_type)}>
                  {currentQuestion.question_type.replace('_', ' ')}
                </Badge>
                <Badge className={getStageColor(currentQuestion.conversation_stage)}>
                  {currentQuestion.conversation_stage}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <p className="text-lg font-medium">{currentQuestion.text}</p>
              
              {currentQuestion.context && (
                <p className="text-sm text-gray-600">
                  <strong>Context:</strong> {currentQuestion.context}
                </p>
              )}
              
              {currentQuestion.expected_response_type && (
                <p className="text-sm text-gray-600">
                  <strong>Expected Response:</strong> {currentQuestion.expected_response_type}
                </p>
              )}
              
              {currentQuestion.follow_up_questions && currentQuestion.follow_up_questions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Follow-up Questions:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {currentQuestion.follow_up_questions.map((question, index) => (
                      <li key={index}>{question}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {currentQuestion.success_indicators && currentQuestion.success_indicators.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Success Indicators:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {currentQuestion.success_indicators.map((indicator, index) => (
                      <li key={index}>{indicator}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button 
                  onClick={() => onQuestionSelect?.(currentQuestion)}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Use This Question
                </Button>
                <Button 
                  onClick={generateQuestion} 
                  variant="outline"
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Objection Handling */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Objection Handling
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <Textarea
              placeholder="Enter customer objection to get AI response..."
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              className="min-h-[80px]"
            />
            <Button 
              onClick={() => handleObjection(customQuestion)}
              disabled={loading || !customQuestion.trim()}
              className="w-full"
            >
              <Brain className="h-4 w-4 mr-2" />
              Handle Objection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-4">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm text-gray-600">Generating question...</p>
        </div>
      )}
    </div>
  );
};

export default QuestionGenerator;
