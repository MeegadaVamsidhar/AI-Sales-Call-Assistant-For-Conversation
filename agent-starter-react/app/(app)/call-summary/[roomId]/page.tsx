'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, MessageSquare, Star, Phone, User, CheckCircle, XCircle, AlertCircle, TrendingUp, ThumbsUp, BarChart3, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CallSummaryData {
  room_id: string;
  call_summary: {
    call_duration_seconds: number;
    total_messages: number;
    customer_satisfaction: number;
    call_outcome: string;
    conversation_summary: string;
    key_topics: string[];
    books_discussed: any[];
    genres_interested: string[];
    authors_mentioned: string[];
    objections_raised: any[];
    concerns_addressed: any[];
    follow_up_actions: string[];
    agent_response_quality: string;
    recommendations_made: number;
    objection_handling_score: number;
    strengths: string[];
    improvement_areas: string[];
    engagement_level: string;
  };
  sentiment_analysis: {
    overall_sentiment: string;
    final_sentiment: string;
    sentiment_journey: Array<{ sequence: number; sentiment: string; confidence: number }>;
    engagement_metrics: {
      average_engagement: number;
      average_satisfaction: number;
      average_purchase_intent: number;
    };
  };
  transcripts: Array<{ id: string; role: string; message: string; timestamp: number }>;
}

export default function CallSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<CallSummaryData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sentiment' | 'transcripts'>('overview');

  useEffect(() => {
    const fetchCallSummary = async () => {
      try {
        setLoading(true);
        console.log('Fetching call summary for room:', roomId);
        const response = await fetch(`http://localhost:8000/api/call-end-report/${roomId}`, {
          method: 'POST',
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch call summary:', response.status, errorText);
          throw new Error(`Failed to fetch call summary: ${response.status}`);
        }
        const data = await response.json();
        console.log('Call summary received:', data);
        setSummaryData(data.report);
      } catch (err) {
        console.error('Error fetching call summary:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    if (roomId) {
      console.log('Room ID available, fetching call summary:', roomId);
      fetchCallSummary();
    } else {
      console.warn('No room ID available for fetching call summary');
    }
  }, [roomId]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
      case 'very_positive':
        return 'text-green-400';
      case 'negative':
      case 'very_negative':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'partial_success':
        return <AlertCircle className="h-6 w-6 text-yellow-500" />;
      default:
        return <XCircle className="h-6 w-6 text-slate-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F172A]">
        <div className="text-center">
          <div className="mb-4 inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent"></div>
          <p className="text-lg text-slate-300">Generating call summary...</p>
        </div>
      </div>
    );
  }

  if (error || !summaryData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F172A]">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardContent className="pt-6 text-center">
            <XCircle className="mx-auto h-16 w-16 text-red-500" />
            <h2 className="mt-4 text-xl font-semibold text-white">Error Loading Summary</h2>
            <p className="mt-2 text-slate-400">{error || 'Failed to load call summary'}</p>
            <Button onClick={() => router.push('/')} className="mt-6 bg-slate-800 hover:bg-slate-700 text-white">Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { call_summary, sentiment_analysis, transcripts } = summaryData;

  return (
    <div className="min-h-screen bg-[#0F172A] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[100px] animate-blob" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-pink-500/10 blur-[100px] animate-blob animation-delay-2000" />
      </div>

      <header className="relative z-10 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-md sticky top-0">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.push('/')} className="gap-2 text-slate-300 hover:text-white hover:bg-slate-800">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Call Summary</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Overview Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Call Outcome</p>
                  <p className="mt-2 text-2xl font-bold text-white capitalize">
                    {call_summary.call_outcome.replace('_', ' ')}
                  </p>
                </div>
                {getOutcomeIcon(call_summary.call_outcome)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Duration</p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {Math.floor(call_summary.call_duration_seconds / 60)}m {(call_summary.call_duration_seconds % 60).toFixed(0)}s
                  </p>
                </div>
                <Clock className="h-6 w-6 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Satisfaction</p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {(call_summary.customer_satisfaction * 100).toFixed(0)}%
                  </p>
                </div>
                <Star className="h-6 w-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Messages</p>
                  <p className="mt-2 text-2xl font-bold text-white">{call_summary.total_messages}</p>
                </div>
                <MessageSquare className="h-6 w-6 text-pink-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-slate-800">
          {['overview', 'sentiment', 'transcripts'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 font-medium transition-all duration-200 capitalize relative ${activeTab === tab
                  ? 'text-purple-400'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTabSummary"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content - Overview */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader><CardTitle className="text-white">Conversation Summary</CardTitle></CardHeader>
              <CardContent><p className="text-slate-300 leading-relaxed">{call_summary.conversation_summary}</p></CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader><CardTitle className="text-white">Key Topics</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {call_summary.key_topics.map((topic, i) => (
                      <span key={i} className="rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-sm font-medium text-purple-300">
                        {topic}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader><CardTitle className="text-white">Books Discussed</CardTitle></CardHeader>
                <CardContent>
                  {call_summary.books_discussed?.length > 0 ? (
                    <ul className="space-y-3">
                      {call_summary.books_discussed.slice(0, 5).map((book, i) => (
                        <li key={i} className="flex items-start gap-3 text-slate-300 bg-slate-800/50 p-3 rounded-lg">
                          <div className="h-8 w-8 rounded bg-slate-700 flex items-center justify-center text-lg">📚</div>
                          <div>
                            <div className="font-medium text-white">{book.title}</div>
                            {book.author && <div className="text-sm text-slate-400">by {book.author}</div>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500">No books discussed</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* User Preferences Section */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <User className="h-5 w-5 text-purple-400" />
                  User Preferences & Interests
                </CardTitle>
                <CardDescription className="text-slate-400">Based on conversation with the AI agent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-300">Genres Interested In:</p>
                    {call_summary.genres_interested?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {call_summary.genres_interested.map((genre, i) => (
                          <span key={i} className="rounded-lg bg-pink-500/10 border border-pink-500/20 px-3 py-1 text-sm font-medium text-pink-300">
                            {genre}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No genre preferences identified</p>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-300">Authors Mentioned:</p>
                    {call_summary.authors_mentioned?.length > 0 ? (
                      <ul className="space-y-1">
                        {call_summary.authors_mentioned.slice(0, 4).map((author, i) => (
                          <li key={i} className="text-sm text-slate-300">• {author}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">No authors mentioned</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Concerns & Follow-ups Section */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-400">
                    <CheckCircle className="h-5 w-5" />
                    Concerns Addressed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {call_summary.concerns_addressed?.length > 0 ? (
                    <ul className="space-y-2">
                      {call_summary.concerns_addressed.map((concern, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1 text-blue-400">✓</span>
                          <div>
                            <p className="text-sm font-medium text-white">{concern.concern || concern}</p>
                            {concern.resolution && (
                              <p className="mt-1 text-xs text-slate-400">{concern.resolution}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No concerns were raised</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-400">
                    <TrendingUp className="h-5 w-5" />
                    Follow-up Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {call_summary.follow_up_actions?.length > 0 ? (
                    <ul className="space-y-2">
                      {call_summary.follow_up_actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-300">
                          <span className="mt-1 text-orange-400">→</span>
                          <span className="text-sm">{action}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No follow-up actions needed</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader><CardTitle className="text-white">Agent Performance</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 rounded-lg bg-slate-800/50">
                    <p className="text-sm font-medium text-slate-400">Response Quality</p>
                    <p className="mt-1 text-lg font-semibold text-white capitalize">{call_summary.agent_response_quality}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-800/50">
                    <p className="text-sm font-medium text-slate-400">Recommendations</p>
                    <p className="mt-1 text-lg font-semibold text-white">{call_summary.recommendations_made}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-800/50">
                    <p className="text-sm font-medium text-slate-400">Objection Handling</p>
                    <p className="mt-1 text-lg font-semibold text-white">{(call_summary.objection_handling_score * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader><CardTitle className="flex items-center gap-2 text-green-400"><ThumbsUp className="h-5 w-5" />Strengths</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {call_summary.strengths.map((strength, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300">
                        <CheckCircle className="mt-1 h-4 w-4 flex-shrink-0 text-green-500" /><span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader><CardTitle className="flex items-center gap-2 text-orange-400"><TrendingUp className="h-5 w-5" />Improvement Areas</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {call_summary.improvement_areas.map((area, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300">
                        <AlertCircle className="mt-1 h-4 w-4 flex-shrink-0 text-orange-500" /><span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Tab Content - Sentiment */}
        {activeTab === 'sentiment' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader><CardTitle className="text-white">Overall Sentiment</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="p-4 rounded-lg bg-slate-800/50">
                    <p className="text-sm font-medium text-slate-400">Overall</p>
                    <p className={`mt-2 text-2xl font-bold capitalize ${getSentimentColor(sentiment_analysis.overall_sentiment)}`}>
                      {sentiment_analysis.overall_sentiment}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-800/50">
                    <p className="text-sm font-medium text-slate-400">Final Sentiment</p>
                    <p className={`mt-2 text-2xl font-bold capitalize ${getSentimentColor(sentiment_analysis.final_sentiment)}`}>
                      {sentiment_analysis.final_sentiment}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-800/50">
                    <p className="text-sm font-medium text-slate-400">Engagement Level</p>
                    <p className="mt-2 text-2xl font-bold text-white capitalize">{call_summary.engagement_level}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader><CardTitle className="text-white">Engagement Metrics</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  {[
                    { label: 'Engagement', value: sentiment_analysis.engagement_metrics.average_engagement, color: 'blue', icon: BarChart3 },
                    { label: 'Satisfaction', value: sentiment_analysis.engagement_metrics.average_satisfaction, color: 'yellow', icon: Star },
                    { label: 'Purchase Intent', value: sentiment_analysis.engagement_metrics.average_purchase_intent, color: 'green', icon: TrendingUp }
                  ].map((metric, i) => (
                    <div key={i}>
                      <p className="text-sm font-medium text-slate-400">{metric.label}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-white">{(metric.value * 100).toFixed(0)}%</span>
                          <metric.icon className={`h-5 w-5 text-${metric.color}-500`} />
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-slate-700">
                          <div className={`h-2 rounded-full bg-${metric.color}-500`} style={{ width: `${metric.value * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Sentiment Journey</CardTitle>
                <CardDescription className="text-slate-400">How sentiment changed throughout the conversation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sentiment_analysis.sentiment_journey.map((point, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-medium text-slate-300 border border-slate-700">{point.sequence}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-medium capitalize ${getSentimentColor(point.sentiment)}`}>{point.sentiment}</span>
                          <span className="text-sm text-slate-500">Confidence: {(point.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-slate-700">
                          <div className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600" style={{ width: `${point.confidence * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tab Content - Transcripts */}
        {activeTab === 'transcripts' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Call Transcripts</CardTitle>
                <CardDescription className="text-slate-400">Complete conversation history ({transcripts.length} messages)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                  {transcripts.map((t) => (
                    <div key={t.id} className={`flex gap-3 ${t.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`flex max-w-[80%] gap-3 ${t.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}>
                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${t.role === 'assistant' ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white' : 'bg-slate-700 text-slate-200'
                          }`}>
                          {t.role === 'assistant' ? <Brain className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        </div>

                        <div className="flex flex-col">
                          <div className={`mb-1 flex items-center gap-2 text-xs font-medium ${t.role === 'assistant' ? 'text-purple-400' : 'text-slate-400 justify-end'}`}>
                            {t.role === 'assistant' ? 'BookWise AI' : 'Customer'}
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-600">{new Date(t.timestamp * 1000).toLocaleTimeString()}</span>
                          </div>

                          <div className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-md ${t.role === 'assistant'
                              ? 'bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-tl-none'
                              : 'bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-tr-none'
                            }`}>
                            <p>{t.message}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Feedback Button - Fixed at bottom */}
        <div className="mt-12 flex justify-center pb-8">
          <Button
            onClick={() => router.push(`/feedback/${roomId}`)}
            size="lg"
            className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6 text-lg font-semibold text-white shadow-xl shadow-purple-500/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/40 rounded-full"
          >
            <Star className="h-5 w-5" />
            Provide Feedback
          </Button>
        </div>
      </main>
    </div>
  );
}
