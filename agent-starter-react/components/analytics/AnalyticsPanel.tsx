'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Heart, 
  Frown, 
  Meh, 
  Smile, 
  ShoppingCart, 
  Clock, 
  User, 
  Phone,
  MessageSquare,
  DollarSign,
  Package,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRoomContext } from '@livekit/components-react';

interface OrderDetails {
  order_id: string;
  customer_name: string;
  phone_number: string;
  book_title: string;
  author: string;
  quantity: number;
  price: number;
  total_amount: number;
  payment_method: string;
  delivery_option: string;
  status: string;
  created_at: string;
}

interface SentimentData {
  overall_sentiment: 'positive' | 'negative' | 'neutral';
  confidence_score: number;
  emotions: {
    joy: number;
    anger: number;
    fear: number;
    sadness: number;
    surprise: number;
  };
  key_phrases: string[];
  conversation_stage: string;
}

interface ConversationMetrics {
  duration: number;
  total_words: number;
  customer_engagement: number;
  objections_handled: number;
  questions_asked: number;
  recommendations_made: number;
}

interface AnalyticsPanelProps {
  roomId?: string;
  customerId?: string;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  roomId,
  customerId
}) => {
  const room = useRoomContext();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [conversationMetrics, setConversationMetrics] = useState<ConversationMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'order' | 'sentiment' | 'metrics'>('order');

  useEffect(() => {
    if (roomId) {
      fetchAnalyticsData();
    }
  }, [roomId]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      
      // Fetch order details
      const orderResponse = await fetch(`${backendUrl}/analytics/order/${roomId}`);
      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        setOrderDetails(orderData);
      }

      // Fetch sentiment analysis
      const sentimentResponse = await fetch(`${backendUrl}/analytics/sentiment/${roomId}`);
      if (sentimentResponse.ok) {
        const sentimentData = await sentimentResponse.json();
        setSentimentData(sentimentData);
      }

      // Fetch conversation metrics
      const metricsResponse = await fetch(`${backendUrl}/analytics/metrics/${roomId}`);
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setConversationMetrics(metricsData);
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Smile className="h-5 w-5 text-green-500" />;
      case 'negative': return <Frown className="h-5 w-5 text-red-500" />;
      default: return <Meh className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Analytics Panel
        </h2>
        <p className="text-sm text-gray-500 mt-1">Real-time insights & order details</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('order')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'order'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShoppingCart className="h-4 w-4 inline mr-1" />
          Order
        </button>
        <button
          onClick={() => setActiveTab('sentiment')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'sentiment'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Heart className="h-4 w-4 inline mr-1" />
          Sentiment
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'metrics'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <TrendingUp className="h-4 w-4 inline mr-1" />
          Metrics
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Order Details Tab */}
        {activeTab === 'order' && (
          <div className="space-y-4">
            {orderDetails ? (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center">
                      <Package className="h-4 w-4 mr-2" />
                      Order #{orderDetails.order_id?.slice(-6) || 'N/A'}
                    </CardTitle>
                    <Badge className={`w-fit ${
                      orderDetails.status === 'completed' ? 'bg-green-100 text-green-800' :
                      orderDetails.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {orderDetails.status?.toUpperCase() || 'UNKNOWN'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium">{orderDetails.customer_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{orderDetails.phone_number || 'N/A'}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="text-sm font-medium">{orderDetails.book_title || 'N/A'}</div>
                      <div className="text-xs text-gray-500">by {orderDetails.author || 'Unknown'}</div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm">Qty: {orderDetails.quantity || 0}</span>
                        <span className="text-sm font-medium">${orderDetails.price || 0}</span>
                      </div>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total:</span>
                        <span className="text-lg font-bold text-green-600">
                          ${orderDetails.total_amount?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {orderDetails.payment_method || 'N/A'} • {orderDetails.delivery_option || 'N/A'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No order details available</p>
                  <p className="text-xs text-gray-400 mt-1">Order will appear during conversation</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Sentiment Analysis Tab */}
        {activeTab === 'sentiment' && (
          <div className="space-y-4">
            {sentimentData ? (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center">
                      {getSentimentIcon(sentimentData.overall_sentiment)}
                      <span className="ml-2">Overall Sentiment</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`px-3 py-2 rounded-lg border ${getSentimentColor(sentimentData.overall_sentiment)}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">{sentimentData.overall_sentiment}</span>
                        <span className="text-sm">{Math.round(sentimentData.confidence_score * 100)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Emotion Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(sentimentData.emotions).map(([emotion, score]) => (
                      <div key={emotion} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{emotion}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${score * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 w-8">{Math.round(score * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {sentimentData.key_phrases.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Key Phrases</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {sentimentData.key_phrases.map((phrase, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {phrase}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No sentiment data available</p>
                  <p className="text-xs text-gray-400 mt-1">Analysis will appear during conversation</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Conversation Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="space-y-4">
            {conversationMetrics ? (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Conversation Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">
                          {formatDuration(conversationMetrics.duration)}
                        </div>
                        <div className="text-xs text-gray-500">Duration</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {conversationMetrics.total_words}
                        </div>
                        <div className="text-xs text-gray-500">Words</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Engagement Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Customer Engagement</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${conversationMetrics.customer_engagement}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium">{conversationMetrics.customer_engagement}%</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-yellow-50 rounded">
                        <div className="text-sm font-bold text-yellow-600">
                          {conversationMetrics.questions_asked}
                        </div>
                        <div className="text-xs text-gray-500">Questions</div>
                      </div>
                      <div className="p-2 bg-purple-50 rounded">
                        <div className="text-sm font-bold text-purple-600">
                          {conversationMetrics.recommendations_made}
                        </div>
                        <div className="text-xs text-gray-500">Recommendations</div>
                      </div>
                      <div className="p-2 bg-red-50 rounded">
                        <div className="text-sm font-bold text-red-600">
                          {conversationMetrics.objections_handled}
                        </div>
                        <div className="text-xs text-gray-500">Objections</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No metrics available</p>
                  <p className="text-xs text-gray-400 mt-1">Metrics will appear during conversation</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200">
        <Button 
          onClick={fetchAnalyticsData}
          disabled={loading}
          size="sm"
          className="w-full"
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
