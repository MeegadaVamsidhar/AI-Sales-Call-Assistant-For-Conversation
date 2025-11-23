'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Star, Send, ArrowLeft, CheckCircle, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Toaster } from '@/components/ui/sonner';
import { toastAlert } from '@/components/alert-toast';

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;

  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [recommendation, setRecommendation] = useState<'yes' | 'no' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toastAlert({
        title: 'Rating Required',
        description: 'Please provide a star rating before submitting',
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('http://localhost:8000/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: roomId,
          customer_id: 'user_' + Date.now(),
          rating: rating,
          feedback_text: feedback,
          service_quality: rating,
          agent_helpfulness: rating,
          overall_experience: rating,
          suggestions: recommendation === 'yes' ? 'Would recommend' : 'Would not recommend',
        }),
      });

      if (response.ok) {
        toastAlert({
          title: 'Thank you!',
          description: 'Your feedback has been submitted successfully',
        });

        // Redirect to home page after 1 second
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      toastAlert({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[100px] animate-blob" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-pink-500/10 blur-[100px] animate-blob animation-delay-2000" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-md sticky top-0">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push(`/call-summary/${roomId}`)}
              className="gap-2 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Summary
            </Button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Share Your Feedback</h1>
            <div className="w-32" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-white">
                How was your experience?
              </CardTitle>
              <CardDescription className="text-lg text-slate-400">
                Your feedback helps us serve you better
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Star Rating */}
                <div className="space-y-3">
                  <label className="block text-center text-sm font-medium text-slate-300">
                    Rate your experience
                  </label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-12 w-12 transition-colors ${star <= (hoveredRating || rating)
                              ? 'fill-yellow-500 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                              : 'text-slate-600'
                            }`}
                        />
                      </motion.button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-sm font-medium text-purple-400"
                    >
                      {rating === 5 && '⭐ Excellent!'}
                      {rating === 4 && '😊 Great!'}
                      {rating === 3 && '🙂 Good'}
                      {rating === 2 && '😐 Fair'}
                      {rating === 1 && '😞 Poor'}
                    </motion.p>
                  )}
                </div>

                {/* Would Recommend */}
                <div className="space-y-3">
                  <label className="block text-center text-sm font-medium text-slate-300">
                    Would you recommend our service?
                  </label>
                  <div className="flex justify-center gap-4">
                    <Button
                      type="button"
                      onClick={() => setRecommendation('yes')}
                      variant={recommendation === 'yes' ? 'default' : 'outline'}
                      className={`gap-2 transition-all duration-200 ${recommendation === 'yes'
                          ? 'bg-green-600 hover:bg-green-700 text-white border-transparent shadow-[0_0_15px_rgba(22,163,74,0.4)]'
                          : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                      <ThumbsUp className="h-5 w-5" />
                      Yes
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setRecommendation('no')}
                      variant={recommendation === 'no' ? 'default' : 'outline'}
                      className={`gap-2 transition-all duration-200 ${recommendation === 'no'
                          ? 'bg-red-600 hover:bg-red-700 text-white border-transparent shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                          : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                      <ThumbsDown className="h-5 w-5" />
                      No
                    </Button>
                  </div>
                </div>

                {/* Feedback Text */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-300">
                    <MessageSquare className="mr-2 inline h-4 w-4 text-purple-400" />
                    Tell us more about your experience (optional)
                  </label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Share your thoughts, suggestions, or concerns..."
                    rows={6}
                    className="bg-slate-900/50 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500/20"
                  />
                  <p className="text-xs text-slate-500">
                    Your detailed feedback helps us understand what we&apos;re doing well and where we can improve.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    type="submit"
                    disabled={submitting || rating === 0}
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 px-12 py-6 text-lg font-semibold text-white shadow-xl shadow-purple-500/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
                  >
                    {submitting ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Submit Feedback
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="text-center bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <Star className="mx-auto h-8 w-8 text-yellow-500" />
                  <h3 className="mt-3 font-semibold text-white">Your Opinion Matters</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    We value every customer&apos;s feedback
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="text-center bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <MessageSquare className="mx-auto h-8 w-8 text-blue-500" />
                  <h3 className="mt-3 font-semibold text-white">Anonymous</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Your feedback is confidential
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="text-center bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
                  <h3 className="mt-3 font-semibold text-white">Continuous Improvement</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    We act on your suggestions
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </main>
      <Toaster />
    </div>
  );
}
