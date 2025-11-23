/**
 * Real-Time Sentiment Analysis Hook
 * Milestone 2: Weeks 3-4 Module 1
 *
 * Provides real-time sentiment analysis integration for the chat interface
 * Includes sentiment tracking, shift detection, and visual indicators
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';

export interface SentimentData {
  overall_sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  confidence: number;
  polarity: number;
  subjectivity: number;
  intensity: number;
  emotions: Record<string, number>;
  sales_metrics?: {
    urgency: number;
    engagement: number;
    satisfaction: number;
    purchase_intent: number;
    objection_level: number;
    trust_level: number;
  };
  metadata: {
    timestamp: string;
    message_length: number;
    processing_time: number;
  };
}

export interface SentimentShift {
  previous_sentiment: string;
  current_sentiment: string;
  shift_magnitude: number;
  shift_direction: 'positive' | 'negative' | 'neutral';
  trigger_phrases: string[];
  timestamp: string;
  confidence: number;
}

export interface SentimentSummary {
  message_count: number;
  average_sentiment: {
    polarity: number;
    confidence: number;
    engagement: number;
    purchase_intent: number;
    trust_level: number;
  };
  sentiment_distribution: Record<string, number>;
  overall_trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
  shifts_detected: number;
  conversation_start: string;
  last_update: string;
}

interface UseSentimentAnalysisReturn {
  // Current sentiment state
  currentSentiment: SentimentData | null;
  sentimentHistory: SentimentData[];
  sentimentShifts: SentimentShift[];
  conversationSummary: SentimentSummary | null;

  // Loading states
  isAnalyzing: boolean;
  isLoadingSummary: boolean;

  // Error handling
  error: string | null;

  // Methods
  analyzeSentiment: (message: string) => Promise<SentimentData | null>;
  getSentimentShifts: () => Promise<SentimentShift[]>;
  getConversationSummary: () => Promise<SentimentSummary | null>;
  clearSentimentHistory: () => Promise<void>;

  // Utility methods
  getSentimentColor: (sentiment: string) => string;
  getSentimentIcon: (sentiment: string) => string;
  getSentimentLabel: (sentiment: string) => string;
  getEngagementLevel: (engagement: number) => 'low' | 'medium' | 'high';
  getPurchaseIntentLevel: (intent: number) => 'low' | 'medium' | 'high';
}

export const useSentimentAnalysis = (): UseSentimentAnalysisReturn => {
  const room = useRoomContext();
  const [currentSentiment, setCurrentSentiment] = useState<SentimentData | null>(null);
  const [sentimentHistory, setSentimentHistory] = useState<SentimentData[]>([]);
  const [sentimentShifts, setSentimentShifts] = useState<SentimentShift[]>([]);
  const [conversationSummary, setConversationSummary] = useState<SentimentSummary | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roomId = room?.name || 'default';
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // API base URL
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  // Analyze sentiment of a message
  const analyzeSentiment = useCallback(
    async (message: string): Promise<SentimentData | null> => {
      if (!message.trim()) return null;

      setIsAnalyzing(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/sentiment/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message,
            user_id: roomId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Sentiment analysis failed: ${response.statusText}`);
        }

        const sentimentData: SentimentData = await response.json();

        // Update current sentiment and history
        setCurrentSentiment(sentimentData);
        setSentimentHistory((prev) => [...prev, sentimentData].slice(-20)); // Keep last 20

        return sentimentData;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Sentiment analysis failed';
        setError(errorMessage);
        console.error('Sentiment analysis error:', err);
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [roomId, API_BASE]
  );

  // Get sentiment shifts for the conversation
  const getSentimentShifts = useCallback(async (): Promise<SentimentShift[]> => {
    try {
      const response = await fetch(`${API_BASE}/sentiment/shifts/${roomId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No shifts data yet - this is normal
          return [];
        }
        throw new Error(`Failed to get sentiment shifts: ${response.statusText}`);
      }

      const data = await response.json();
      const shifts = data.shifts || [];

      setSentimentShifts(shifts);
      return shifts;
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        console.warn('Backend not available for sentiment shifts');
        setError('Backend service unavailable');
      } else {
        console.error('Error getting sentiment shifts:', err);
      }
      return [];
    }
  }, [roomId, API_BASE]);

  // Get conversation sentiment summary
  const getConversationSummary = useCallback(async (): Promise<SentimentSummary | null> => {
    setIsLoadingSummary(true);

    try {
      const response = await fetch(`${API_BASE}/sentiment/summary/${roomId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No sentiment data yet
          return null;
        }
        throw new Error(`Failed to get conversation summary: ${response.statusText}`);
      }

      const data = await response.json();
      const summary = data.summary;

      setConversationSummary(summary);
      return summary;
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        console.warn('Backend not available for conversation summary');
      } else {
        console.error('Error getting conversation summary:', err);
      }
      return null;
    } finally {
      setIsLoadingSummary(false);
    }
  }, [roomId, API_BASE]);

  // Clear sentiment history
  const clearSentimentHistory = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/sentiment/clear/${roomId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to clear sentiment history: ${response.statusText}`);
      }

      // Clear local state
      setCurrentSentiment(null);
      setSentimentHistory([]);
      setSentimentShifts([]);
      setConversationSummary(null);
    } catch (err) {
      console.error('Error clearing sentiment history:', err);
      setError('Failed to clear sentiment history');
    }
  }, [roomId, API_BASE]);

  // Utility function to get sentiment color
  const getSentimentColor = useCallback((sentiment: string): string => {
    switch (sentiment) {
      case 'very_positive':
        return 'text-green-600 bg-green-50';
      case 'positive':
        return 'text-green-500 bg-green-50';
      case 'neutral':
        return 'text-gray-500 bg-gray-50';
      case 'negative':
        return 'text-red-500 bg-red-50';
      case 'very_negative':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  }, []);

  // Utility function to get sentiment icon
  const getSentimentIcon = useCallback((sentiment: string): string => {
    switch (sentiment) {
      case 'very_positive':
        return '😊';
      case 'positive':
        return '🙂';
      case 'neutral':
        return '😐';
      case 'negative':
        return '😕';
      case 'very_negative':
        return '😞';
      default:
        return '😐';
    }
  }, []);

  // Utility function to get sentiment label
  const getSentimentLabel = useCallback((sentiment: string): string => {
    switch (sentiment) {
      case 'very_positive':
        return 'Very Positive';
      case 'positive':
        return 'Positive';
      case 'neutral':
        return 'Neutral';
      case 'negative':
        return 'Negative';
      case 'very_negative':
        return 'Very Negative';
      default:
        return 'Unknown';
    }
  }, []);

  // Utility function to get engagement level
  const getEngagementLevel = useCallback((engagement: number): 'low' | 'medium' | 'high' => {
    if (engagement >= 0.7) return 'high';
    if (engagement >= 0.4) return 'medium';
    return 'low';
  }, []);

  // Utility function to get purchase intent level
  const getPurchaseIntentLevel = useCallback((intent: number): 'low' | 'medium' | 'high' => {
    if (intent >= 0.7) return 'high';
    if (intent >= 0.4) return 'medium';
    return 'low';
  }, []);

  // Poll for real-time sentiment updates
  useEffect(() => {
    const pollSentimentData = async () => {
      try {
        const response = await fetch(`${API_BASE}/sentiment/realtime/${roomId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.current_sentiment) {
            setCurrentSentiment(data.current_sentiment);
          }
          if (data.recent_analysis) {
            setSentimentHistory(data.recent_analysis);
          }
        }
      } catch (err) {
        // Silently fail for polling - backend might not be ready
        console.debug('Sentiment polling error:', err);
      }
    };

    // Start polling every 10 seconds when room is active (increased interval)
    if (roomId && roomId !== 'default') {
      // Initial load with delay to let backend start
      setTimeout(() => {
        pollSentimentData();
        getSentimentShifts().catch(() => {}); // Ignore errors on initial load
        getConversationSummary().catch(() => {}); // Ignore errors on initial load
      }, 2000);

      pollingInterval.current = setInterval(pollSentimentData, 10000);
    }

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [roomId, API_BASE, getSentimentShifts, getConversationSummary]);

  return {
    currentSentiment,
    sentimentHistory,
    sentimentShifts,
    conversationSummary,
    isAnalyzing,
    isLoadingSummary,
    error,
    analyzeSentiment,
    getSentimentShifts,
    getConversationSummary,
    clearSentimentHistory,
    getSentimentColor,
    getSentimentIcon,
    getSentimentLabel,
    getEngagementLevel,
    getPurchaseIntentLevel,
  };
};

export default useSentimentAnalysis;
