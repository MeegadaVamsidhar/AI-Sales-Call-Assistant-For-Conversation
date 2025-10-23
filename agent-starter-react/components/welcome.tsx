'use client';

import { Mic, Sparkles, BookOpen, Star, Library, Phone, Users, Clock, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';

interface WelcomeProps {
  disabled: boolean;
  startButtonText: string;
  onStartCall: () => void;
}

export const Welcome = ({
  disabled,
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeProps) => {
  const router = useRouter();
  
  const handleStartCall = () => {
    // Navigate to session page instead of starting call inline
    router.push('/session');
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 via-pink-50 to-orange-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Main Content */}
      <main className="relative z-10 flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-white/90 to-blue-50/90 backdrop-blur-sm rounded-full border border-gradient-to-r from-blue-200 to-purple-200 shadow-lg mb-6">
              <Sparkles className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-gray-700">AI-Powered Book Assistant</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-6">
              BookWise AI
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-gray-700 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Intelligent Book Consultation
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Discover your perfect next read with our AI-powered assistant. Get personalized recommendations, 
              detailed reviews, and seamless ordering - all through natural conversation.
            </p>
          </motion.div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-2xl shadow-xl border border-gradient-to-r from-blue-200/50 to-purple-200/50 p-8 md:p-12 mb-12"
          >
            <div className="flex flex-col items-center gap-8 md:flex-row md:gap-12">
              {/* Left Side */}
              <div className="flex flex-1 flex-col items-center space-y-6 text-center md:items-start md:text-left">
                {/* BookWise Logo */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">BookWise</span>
                    <p className="text-lg text-gray-600">Smart Book Recommendation Assistant</p>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-3">
                  <h3 className="text-3xl font-bold text-gray-900 md:text-4xl">AI Book Consultation</h3>
                  <p className="flex items-center justify-center gap-2 text-lg text-gray-700 md:justify-start">
                    <Star size={20} className="text-amber-500" />
                    Personalized Reading Experience
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3 text-sm md:text-base">
                  <div className="flex items-center gap-2 text-gray-700">
                    <BookOpen size={16} className="text-amber-500" />
                    <span>Voice-Powered Book Search</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Star size={16} className="text-amber-500" />
                    <span>AI-Driven Recommendations</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Library size={16} className="text-amber-500" />
                    <span>Personal Reading Library</span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden h-48 w-px bg-gray-200 md:block" />

              {/* Right Side - Button */}
              <div className="flex flex-col items-center justify-center space-y-4 md:pl-4">
                <Button
                  onClick={onStartCall}
                  disabled={disabled}
                  size="lg"
                  className="flex h-16 w-72 scale-105 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-lg font-bold text-white shadow-xl transition-all duration-300 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 hover:shadow-2xl hover:scale-110"
                >
                  <Mic size={24} />
                  {startButtonText}
                </Button>
                <p className="text-sm text-gray-500">Click to discover your next great read</p>
              </div>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid md:grid-cols-3 gap-8 mb-16"
          >
            <motion.div 
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="group bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Smart Recommendations</h4>
                <p className="text-gray-600 leading-relaxed">Advanced AI analyzes your reading preferences, past purchases, and reviews to suggest books you'll absolutely love.</p>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="group bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Expert Consultation</h4>
                <p className="text-gray-600 leading-relaxed">Chat naturally with our AI assistant for detailed book information, reviews, and personalized reading advice.</p>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="group bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-red-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Instant Ordering</h4>
                <p className="text-gray-600 leading-relaxed">Seamlessly place orders with multiple payment options, delivery choices, and real-time order tracking.</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center shadow-2xl"
          >
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold mb-2">10,000+</div>
                <div className="text-blue-100">Books Available</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">5,000+</div>
                <div className="text-purple-100">Happy Customers</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">24/7</div>
                <div className="text-pink-100">AI Support</div>
              </div>
            </div>
          </motion.div>

          {/* Help text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Need help finding the perfect book?{' '}
              <button
                type="button"
                onClick={onStartCall}
                className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent underline-offset-4 hover:underline"
              >
                Start consultation call
              </button>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
