/**
 * Sentiment Indicator Component
 * Real-time visual indicators for sentiment analysis
 */

'use client';

import React from 'react';
import {
  AlertTriangle,
  Brain,
  Clock,
  Heart,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { SentimentData, SentimentShift, useSentimentAnalysis } from '@/hooks/useSentimentAnalysis';

/**
 * Sentiment Indicator Component
 * Real-time visual indicators for sentiment analysis
 */

interface SentimentIndicatorProps {
  sentiment: SentimentData | null;
  shifts: SentimentShift[];
  showDetails?: boolean;
  compact?: boolean;
}

export const SentimentIndicator: React.FC<SentimentIndicatorProps> = ({
  sentiment,
  shifts,
  showDetails = false,
  compact = false,
}) => {
  const { getSentimentColor, getSentimentIcon, getSentimentLabel } = useSentimentAnalysis();

  if (!sentiment) {
    return (
      <div className="flex items-center space-x-2 text-gray-400">
        <div className="h-2 w-2 animate-pulse rounded-full bg-gray-300" />
        <span className="text-sm">Analyzing...</span>
      </div>
    );
  }

  const sentimentColor = getSentimentColor(sentiment.overall_sentiment);
  const sentimentIcon = getSentimentIcon(sentiment.overall_sentiment);
  const sentimentLabel = getSentimentLabel(sentiment.overall_sentiment);

  // Get the most recent shift
  const recentShift = shifts.length > 0 ? shifts[shifts.length - 1] : null;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center space-x-2 rounded-full px-3 py-1 ${sentimentColor}`}
      >
        <span className="text-lg">{sentimentIcon}</span>
        <span className="text-sm font-medium">{sentimentLabel}</span>
        <div className="h-1 w-1 rounded-full bg-current opacity-60" />
        <span className="text-xs">{Math.round(sentiment.confidence * 100)}%</span>

        {recentShift && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="ml-2 flex items-center"
          >
            {recentShift.shift_direction === 'positive' ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : recentShift.shift_direction === 'negative' ? (
              <TrendingDown className="h-3 w-3 text-red-500" />
            ) : (
              <Minus className="h-3 w-3 text-gray-500" />
            )}
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border bg-white p-4 shadow-sm"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`rounded-full p-2 ${sentimentColor}`}>
            <span className="text-xl">{sentimentIcon}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{sentimentLabel}</h3>
            <p className="text-sm text-gray-500">
              Confidence: {Math.round(sentiment.confidence * 100)}%
            </p>
          </div>
        </div>

        {recentShift && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center space-x-1 rounded-full px-2 py-1 text-xs font-medium ${
              recentShift.shift_direction === 'positive'
                ? 'bg-green-100 text-green-700'
                : recentShift.shift_direction === 'negative'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
            }`}
          >
            {recentShift.shift_direction === 'positive' ? (
              <TrendingUp className="h-3 w-3" />
            ) : recentShift.shift_direction === 'negative' ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            <span>Shift Detected</span>
          </motion.div>
        )}
      </div>

      {/* Sentiment Metrics */}
      {/* Sales Metrics - Only show if available */}
      {sentiment.sales_metrics && (
        <>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Heart className="h-4 w-4 text-pink-500" />
              <div>
                <div className="text-xs text-gray-500">Satisfaction</div>
                <div className="text-sm font-medium">
                  {Math.round((sentiment.sales_metrics.satisfaction || 0) * 100)}%
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-xs text-gray-500">Purchase Intent</div>
                <div className="text-sm font-medium">
                  {Math.round((sentiment.sales_metrics.purchase_intent || 0) * 100)}%
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-xs text-gray-500">Engagement</div>
                <div className="text-sm font-medium">
                  {Math.round((sentiment.sales_metrics.engagement || 0) * 100)}%
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-xs text-gray-500">Trust Level</div>
                <div className="text-sm font-medium">
                  {Math.round((sentiment.sales_metrics.trust_level || 0) * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Objection Level Warning */}
          {(sentiment.sales_metrics.objection_level || 0) > 0.6 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-3 flex items-center space-x-2 rounded-md border border-yellow-200 bg-yellow-50 p-2"
            >
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                High objection level detected (
                {Math.round(sentiment.sales_metrics.objection_level * 100)}%)
              </span>
            </motion.div>
          )}

          {/* Urgency Indicator */}
          {(sentiment.sales_metrics.urgency || 0) > 0.7 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-3 flex items-center space-x-2 rounded-md border border-orange-200 bg-orange-50 p-2"
            >
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-800">
                High urgency detected - customer needs quick response
              </span>
            </motion.div>
          )}
        </>
      )}

      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 border-t pt-3"
        >
          {/* Emotion Breakdown */}
          {Object.keys(sentiment.emotions).length > 0 && (
            <div className="mb-3">
              <h4 className="mb-2 text-sm font-medium text-gray-700">Emotions Detected</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(sentiment.emotions)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 4)
                  .map(([emotion, score]) => (
                    <div key={emotion} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 capitalize">{emotion}</span>
                      <div className="flex items-center space-x-1">
                        <div className="h-1 w-12 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${score * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{Math.round(score * 100)}%</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Recent Shifts */}
          {shifts.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700">Recent Sentiment Changes</h4>
              <div className="space-y-2">
                {shifts.slice(-3).map((shift, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      {shift.shift_direction === 'positive' ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : shift.shift_direction === 'negative' ? (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      ) : (
                        <Minus className="h-3 w-3 text-gray-500" />
                      )}
                      <span className="text-gray-600">
                        {shift.previous_sentiment} → {shift.current_sentiment}
                      </span>
                    </div>
                    <span className="text-gray-400">
                      {new Date(shift.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default SentimentIndicator;
