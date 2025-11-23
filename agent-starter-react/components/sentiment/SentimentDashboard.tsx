/**
 * Sentiment Analysis Dashboard
 * Comprehensive sentiment analytics and visualization
 */

'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Brain,
  Clock,
  Eye,
  EyeOff,
  Heart,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { SentimentData, SentimentSummary, useSentimentAnalysis } from '@/hooks/useSentimentAnalysis';
import SentimentIndicator from './SentimentIndicator';

/**
 * Sentiment Analysis Dashboard
 * Comprehensive sentiment analytics and visualization
 */

interface SentimentDashboardProps {
  className?: string;
}

const SentimentGraph: React.FC<{ data: SentimentData[] }> = ({ data }) => {
  if (data.length === 0) return null;

  // Ensure we have at least 2 points for a line
  const graphData = data.length < 2 ? [...data, ...data] : data;

  const getY = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 10;
      case 'neutral': return 50;
      case 'negative': return 90;
      default: return 50;
    }
  };

  const points = graphData.map((d, i) => {
    const x = (i / (graphData.length - 1)) * 100;
    const y = getY(d.overall_sentiment);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full p-4 bg-slate-50/50 rounded-lg border border-slate-100">
      <div className="h-32 w-full relative">
        {/* Y-Axis Labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-slate-400 font-medium py-1">
          <span className="text-green-600">Pos</span>
          <span className="text-slate-500">Neu</span>
          <span className="text-red-500">Neg</span>
        </div>

        <div className="ml-8 h-full relative">
          <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="10" x2="100" y2="10" stroke="#e2e8f0" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeDasharray="4 4" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="#e2e8f0" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeDasharray="4 4" />
            <line x1="0" y1="90" x2="100" y2="90" stroke="#e2e8f0" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeDasharray="4 4" />

            <defs>
              <linearGradient id="lineGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#7C4DFF" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#7C4DFF" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area */}
            <path
              d={`M0,100 L0,${getY(graphData[0].overall_sentiment)} ${points.split(' ').map(p => 'L' + p).join(' ')} L100,${getY(graphData[graphData.length - 1].overall_sentiment)} L100,100 Z`}
              fill="url(#lineGradient)"
            />

            {/* Line */}
            <polyline
              points={points}
              fill="none"
              stroke="#7C4DFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* Dots */}
            {graphData.map((d, i) => (
              <circle
                key={i}
                cx={(i / (graphData.length - 1)) * 100}
                cy={getY(d.overall_sentiment)}
                r="3"
                className="fill-white stroke-[#7C4DFF] stroke-2"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-2 ml-8">
        <span>Start</span>
        <span>Current</span>
      </div>
    </div>
  );
};

export const SentimentDashboard: React.FC<SentimentDashboardProps> = ({ className = '' }) => {
  const {
    currentSentiment,
    sentimentHistory,
    sentimentShifts,
    conversationSummary,
    isLoadingSummary,
    error,
    getSentimentShifts,
    getConversationSummary,
    clearSentimentHistory,
    getSentimentColor,
    getSentimentLabel,
  } = useSentimentAnalysis();

  const [showDetails, setShowDetails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh summary every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      getConversationSummary();
      getSentimentShifts();
    }, 30000);

    return () => clearInterval(interval);
  }, [getConversationSummary, getSentimentShifts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([getConversationSummary(), getSentimentShifts()]);
    setRefreshing(false);
  };

  const handleClearHistory = async () => {
    if (
      confirm('Are you sure you want to clear all sentiment history? This action cannot be undone.')
    ) {
      await clearSentimentHistory();
    }
  };

  const getEngagementColor = (level: number) => {
    if (level >= 0.7) return 'text-green-600 bg-green-50';
    if (level >= 0.4) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getPurchaseIntentColor = (level: number) => {
    if (level >= 0.7) return 'text-blue-600 bg-blue-50';
    if (level >= 0.4) return 'text-indigo-600 bg-indigo-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">Sentiment Analysis</h2>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-1"
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{showDetails ? 'Hide' : 'Show'} Details</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-1"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2 rounded-md border border-red-200 bg-red-50 p-3"
        >
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-800">{error}</span>
        </motion.div>
      )}

      {/* Current Sentiment */}
      <SentimentIndicator
        sentiment={currentSentiment}
        shifts={sentimentShifts}
        showDetails={showDetails}
        compact={false}
      />

      {/* Conversation Summary */}
      {conversationSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border bg-white p-4 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center space-x-2 font-semibold text-gray-900">
              <BarChart3 className="h-4 w-4" />
              <span>Conversation Analytics</span>
            </h3>

            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{conversationSummary.message_count} messages</span>
              <span>•</span>
              <span>{conversationSummary.shifts_detected} shifts</span>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(conversationSummary.average_sentiment.polarity * 100)}
              </div>
              <div className="text-xs text-gray-500">Avg Polarity</div>
            </div>

            <div
              className={`rounded-lg p-3 text-center ${getEngagementColor(conversationSummary.average_sentiment.engagement)}`}
            >
              <div className="text-2xl font-bold">
                {Math.round(conversationSummary.average_sentiment.engagement * 100)}%
              </div>
              <div className="text-xs opacity-75">Engagement</div>
            </div>

            <div
              className={`rounded-lg p-3 text-center ${getPurchaseIntentColor(conversationSummary.average_sentiment.purchase_intent)}`}
            >
              <div className="text-2xl font-bold">
                {Math.round(conversationSummary.average_sentiment.purchase_intent * 100)}%
              </div>
              <div className="text-xs opacity-75">Purchase Intent</div>
            </div>

            <div className="rounded-lg bg-green-50 p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(conversationSummary.average_sentiment.trust_level * 100)}%
              </div>
              <div className="text-xs text-green-600">Trust Level</div>
            </div>
          </div>

          {/* Trend Indicator */}
          <div className="mb-4 flex items-center justify-center space-x-2 rounded-lg bg-gray-50 p-3">
            {conversationSummary.overall_trend === 'improving' ? (
              <>
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-700">Conversation is improving</span>
              </>
            ) : conversationSummary.overall_trend === 'declining' ? (
              <>
                <TrendingDown className="h-5 w-5 text-red-500" />
                <span className="font-medium text-red-700">Conversation is declining</span>
              </>
            ) : conversationSummary.overall_trend === 'stable' ? (
              <>
                <div className="h-5 w-5 rounded-full bg-gray-400" />
                <span className="font-medium text-gray-700">Conversation is stable</span>
              </>
            ) : (
              <>
                <div className="h-5 w-5 animate-pulse rounded-full bg-gray-300" />
                <span className="text-gray-500">Insufficient data for trend analysis</span>
              </>
            )}
          </div>

          {/* Sentiment Distribution */}
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="border-t pt-4"
            >
              <h4 className="mb-3 text-sm font-medium text-gray-700">Sentiment Distribution</h4>
              <div className="space-y-2">
                {Object.entries(conversationSummary.sentiment_distribution)
                  .filter(([, count]) => count > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([sentiment, count]) => {
                    const percentage = (count / conversationSummary.message_count) * 100;
                    const colorClass = getSentimentColor(sentiment);

                    return (
                      <div key={sentiment} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`rounded px-2 py-1 text-xs ${colorClass}`}>
                            {getSentimentLabel(sentiment)}
                          </div>
                          <span className="text-sm text-gray-600">{count} messages</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-8 text-xs text-gray-500">
                            {Math.round(percentage)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Sentiment History */}
      {showDetails && sentimentHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border bg-white p-4 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Sentiment Journey</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              className="text-red-600 hover:text-red-700"
            >
              Clear History
            </Button>
          </div>

          <SentimentGraph data={sentimentHistory} />
        </motion.div>
      )}

      {/* No Data State */}
      {!currentSentiment && !isLoadingSummary && (
        <div className="py-8 text-center text-gray-500">
          <Brain className="mx-auto mb-3 h-12 w-12 opacity-50" />
          <p>No sentiment data available yet.</p>
          <p className="text-sm">Start a conversation to see real-time sentiment analysis.</p>
        </div>
      )}
    </div>
  );
};

export default SentimentDashboard;
