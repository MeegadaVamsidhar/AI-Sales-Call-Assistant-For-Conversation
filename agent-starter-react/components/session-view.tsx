'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Brain,
  Calendar,
  ChevronDown,
  FileText,
  Mic,
  ShoppingCart,
  Star,
  User,
  X,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AnimatePresence, motion } from 'motion/react';
import {
  type AgentState,
  type ReceivedChatMessage,
  useRoomContext,
  useVoiceAssistant,
} from '@livekit/components-react';
import { toastAlert } from '@/components/alert-toast';
import { AgentControlBar } from '@/components/livekit/agent-control-bar/agent-control-bar';
import { ChatEntry } from '@/components/livekit/chat/chat-entry';
import { ChatMessageView } from '@/components/livekit/chat/chat-message-view';
import RecommendationPanel from '@/components/recommendations/RecommendationPanel';
import AnalyticsPanel from '@/components/analytics/AnalyticsPanel';
import OrderHistory from '@/components/orders/OrderHistory';
import { Button } from '@/components/ui/button';
import useBackendSync from '@/hooks/useBackendSync';
import useChatAndTranscription from '@/hooks/useChatAndTranscription';
import { useDebugMode } from '@/hooks/useDebug';
import useOrderData from '@/hooks/useOrderData';
import type { AppConfig } from '@/lib/types';
import { cn } from '@/lib/utils';

function isAgentAvailable(agentState: AgentState) {
  return agentState == 'listening' || agentState == 'thinking' || agentState == 'speaking';
}

interface SessionViewProps {
  appConfig: AppConfig;
  disabled: boolean;
  sessionStarted: boolean;
  onStartCall?: () => void;
}

export const SessionView = ({
  appConfig,
  disabled,
  sessionStarted,
  ref,
}: React.ComponentProps<'div'> & SessionViewProps) => {
  const { state: agentState } = useVoiceAssistant();
  const [chatOpen, setChatOpen] = useState(false);
  const { messages, send } = useChatAndTranscription();
  const room = useRoomContext();
  const [activeTab, setActiveTab] = useState('recommendations');
  const [selectedCustomerId, setSelectedCustomerId] = useState('CUST001');
  const { orderData: backendOrderData, loading: orderLoading, error: orderError } = useOrderData();

  const [localOrderData, setLocalOrderData] = useState({
    customerName: '',
    contactId: '',
    bookTitle: '',
    author: '',
    genre: '',
    quantity: '1',
    paymentMethod: 'Credit Card',
    deliveryOption: 'Home Delivery',
    specialRequests: '',
  });

  const orderData = {
    customerName: backendOrderData.customer_name || localOrderData.customerName,
    contactId: backendOrderData.customer_id || localOrderData.contactId,
    bookTitle: backendOrderData.book_title || localOrderData.bookTitle,
    author: backendOrderData.author || localOrderData.author,
    genre: backendOrderData.genre || localOrderData.genre,
    quantity: backendOrderData.quantity?.toString() || localOrderData.quantity,
    paymentMethod: backendOrderData.payment_method || localOrderData.paymentMethod,
    deliveryOption: backendOrderData.delivery_option || localOrderData.deliveryOption,
    specialRequests: backendOrderData.special_requests || localOrderData.specialRequests,
  };
  const [callEnded, setCallEnded] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const chatScrollRef = React.useRef<HTMLDivElement>(null);
  const [detectedOrder, setDetectedOrder] = useState<any>(null);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  const displayOrderConfirmation = () => {
    const orderDetails = {
      bookTitle: orderData.bookTitle || 'Selected Book',
      author: orderData.author || 'Unknown Author',
      quantity: orderData.quantity || '1',
      paymentMethod: orderData.paymentMethod || 'Credit Card',
      deliveryOption: orderData.deliveryOption || 'Home Delivery',
      customerName: orderData.customerName || 'Customer',
    };

    return `Got it! You're ordering "${orderDetails.bookTitle}" by ${orderDetails.author}. \nQuantity: ${orderDetails.quantity}\nPayment: ${orderDetails.paymentMethod}\nDelivery: ${orderDetails.deliveryOption}\n\nShall I proceed with this order for ${orderDetails.customerName}?`;
  };

  useEffect(() => {
    if (!sessionStarted && messages.length > 0) {
      setCallEnded(true);
    }
  }, [sessionStarted, messages.length]);

  async function handleSendMessage(message: string) {
    await send(message);
  }

  const handleDisconnect = () => {
    // Disconnect will be handled by the parent component and redirect to summary
  };

  const handleOrderSubmit = async () => {
    if (!orderData.bookTitle || !orderData.customerName || !orderData.contactId) {
      toastAlert({
        title: 'Incomplete Order',
        description: 'Please ensure book title, customer name, and contact ID are filled.',
      });
      return;
    }

    try {
      setOrderSubmitting(true);

      const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
      const roomId = (room as any)?.name || (room as any)?.room?.name;

      const orderPayload = {
        ...orderData,
        order_status: 'confirmed',
        order_date: new Date().toISOString(),
      };

      const response = await fetch(`${backendBase}/orders/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: roomId,
          order_data: orderPayload,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setOrderSubmitted(true);

        toastAlert({
          title: 'Order Submitted Successfully!',
          description: `Order ID: ${result.order_id || 'Generated'}. You will receive a confirmation shortly.`,
        });

        await send(
          `Order confirmed! Order details: ${orderData.bookTitle} by ${orderData.author}, Quantity: ${orderData.quantity}, Total: $${orderData.quantity ? (parseFloat(orderData.quantity) * 15.99).toFixed(2) : '15.99'}`
        );
      } else {
        throw new Error('Failed to submit order');
      }
    } catch (error) {
      console.error('Order submission error:', error);
      toastAlert({
        title: 'Order Submission Failed',
        description: 'Please try again or contact support.',
      });
    } finally {
      setOrderSubmitting(false);
    }
  };


  useEffect(() => {
    if (sessionStarted) {
      const timeout = setTimeout(() => {
        if (!isAgentAvailable(agentState)) {
          const reason =
            agentState === 'connecting'
              ? 'Agent did not join the room. '
              : 'Agent connected but did not complete initializing. ';

          toastAlert({
            title: 'Session ended',
            description: (
              <p className="w-full">
                {reason}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://docs.livekit.io/agents/start/voice-ai/"
                  className="whitespace-nowrap underline"
                >
                  See quickstart guide
                </a>
                .
              </p>
            ),
          });
          room.disconnect();
        }
      }, 20_000);

      return () => clearTimeout(timeout);
    }
  }, [agentState, sessionStarted, room]);

  useBackendSync(messages);

  const { supportsChatInput, supportsVideoInput, supportsScreenShare } = appConfig;
  const capabilities = {
    supportsChatInput,
    supportsVideoInput,
    supportsScreenShare,
  };

  return (
    <section
      ref={ref}
      inert={disabled}
      className={cn(
        'w-full h-screen bg-background overflow-hidden'
      )}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[100px] animate-blob" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-pink-500/10 blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[100px] animate-blob animation-delay-4000" />
      </div>

      {/* Full Screen Two Halves Layout */}
      <div className="relative flex h-screen w-full z-10">
        {/* Left Half - Recommendations & Tools */}
        <div className="flex w-1/2 flex-col overflow-hidden border-r border-border/50 bg-card/30 backdrop-blur-xl">
          {/* Tab Navigation */}
          <div className="sticky top-0 z-40 border-b border-border/50 bg-card/80 backdrop-blur-md">
            <div className="flex">
              <button
                onClick={() => setActiveTab('recommendations')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all duration-200 relative',
                  activeTab === 'recommendations'
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <BookOpen className="h-4 w-4" />
                Recommendations
                {activeTab === 'recommendations' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all duration-200 relative',
                  activeTab === 'analytics'
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <BarChart3 className="h-4 w-4" />
                My Orders
                {activeTab === 'analytics' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
                  />
                )}
              </button>
            </div>


          </div>

          {activeTab === 'recommendations' && (
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              <RecommendationPanel
                customerId={selectedCustomerId}
                conversationContext={messages.map(m => `${m.from?.name || 'User'}: ${m.message}`).join(' ')}
                onBookSelect={(book) => {
                  setLocalOrderData({
                    ...localOrderData,
                    bookTitle: book.title,
                    author: book.author,
                    genre: book.genre,
                  });
                  toastAlert({
                    title: `Selected: ${book.title}`,
                    description: `by ${book.author}`
                  });
                }}
              />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              <OrderHistory />
            </div>
          )}
        </div>

        {/* Right Half - Live Transcription & Chat */}
        <div className="relative flex w-1/2 flex-col overflow-hidden bg-background/30 backdrop-blur-sm">
          {/* Enhanced Chat Header */}
          <div className="border-b border-border/50 bg-background/80 backdrop-blur-md p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-500/20">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background bg-green-500">
                    <span className="absolute inset-0 animate-ping rounded-full bg-green-500 opacity-75"></span>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    BookWise AI
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-purple-400">Intelligent Assistant</span>
                    <span className="h-1 w-1 rounded-full bg-muted"></span>
                    <span className="text-xs text-muted-foreground">Live Session</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-purple-300">Recording</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Messages Container */}
          <div className="flex min-h-0 flex-1 flex-col bg-transparent">
            <ChatMessageView
              className="scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent flex-1 space-y-6 overflow-y-auto px-6 py-6"
              onScroll={(e) => {
                const target = e.target as HTMLElement;
                const isAtBottom =
                  target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
                setShowControls(isAtBottom);
                setShowScrollToBottom(!isAtBottom);
              }}
              ref={chatScrollRef}
            >

              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center max-w-sm mx-auto p-8 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                      <Mic className="h-8 w-8 text-purple-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-white">Ready to Assist</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Start speaking to interact with the AI. I can help you find books, check orders, and provide recommendations.
                    </p>
                  </div>
                </div>
              )}

              {messages.map((message, index) => {
                const localParticipant = room.localParticipant;
                const fromIdentity = (message.from?.identity || '').toString();
                const fromName = (message.from?.name || '').toString();
                const fromLocalParticipant =
                  message.from?.identity === localParticipant?.identity ||
                  message.from?.sid === localParticipant?.sid ||
                  message.from?.isLocal === true;
                const isAgentParticipant =
                  message.from?.isAgent === true ||
                  fromIdentity.toLowerCase().includes('agent') ||
                  fromIdentity.toLowerCase().includes('assistant') ||
                  fromName.toLowerCase().includes('agent') ||
                  fromName.toLowerCase().includes('assistant');
                const isAgentMessage = Boolean(isAgentParticipant) && !fromLocalParticipant;
                const speakerName = isAgentMessage ? 'BookWise AI' : 'You';

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    key={index}
                    className={cn('flex w-full', isAgentMessage ? 'justify-start' : 'justify-end')}
                  >
                    <div className={cn('flex max-w-[85%] gap-3', isAgentMessage ? 'flex-row' : 'flex-row-reverse')}>
                      {/* Avatar */}
                      <div className="flex-shrink-0 mt-1">
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-lg',
                          isAgentMessage
                            ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white'
                            : 'bg-secondary text-secondary-foreground'
                        )}>
                          {isAgentMessage ? <Brain className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        </div>
                      </div>

                      <div className={cn('flex flex-col', isAgentMessage ? 'items-start' : 'items-end')}>
                        <div className="mb-1 flex items-center gap-2">
                          <span className={cn(
                            'text-xs font-medium',
                            isAgentMessage ? 'text-purple-400' : 'text-slate-400'
                          )}>
                            {speakerName}
                          </span>
                          <span className="text-[10px] text-slate-600">
                            {new Date(message.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div
                          className={cn(
                            'relative rounded-2xl px-5 py-3.5 shadow-md text-sm leading-relaxed',
                            isAgentMessage
                              ? 'bg-card/80 border border-border/50 text-foreground rounded-tl-none'
                              : 'bg-gradient-to-r from-[#7C4DFF] to-[#FF3CA6] text-white rounded-tr-none'
                          )}
                        >
                          <p className="whitespace-pre-wrap font-medium">
                            {message.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Order Confirmation Display */}
              {detectedOrder && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mx-auto max-w-md w-full"
                >
                  <div className="relative overflow-hidden rounded-xl border border-purple-500/30 bg-card/90 shadow-2xl shadow-purple-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 pointer-events-none" />
                    <div className="relative p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                          <ShoppingCart className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">Order Detected</h3>
                          <p className="text-xs text-slate-400">Please confirm the details below</p>
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-4 mb-4 border border-border">
                        <p className="text-sm text-slate-300 whitespace-pre-line">
                          {detectedOrder.message}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white border-none"
                          onClick={() => {
                            console.log('Order confirmed:', orderData);
                            setDetectedOrder(null);
                          }}
                        >
                          Confirm Order
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                          onClick={() => setDetectedOrder(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </ChatMessageView>
          </div>

          {/* Bottom Control Bar */}
          {/* Bottom Control Bar */}
          <div className="border-t border-border/50 bg-background/80 backdrop-blur-md p-4">
            <motion.div
              key="control-bar"
              initial={{ opacity: 0, translateY: '20px' }}
              animate={{
                opacity: sessionStarted ? 1 : 0,
                translateY: sessionStarted ? '0px' : '20px',
              }}
              transition={{ duration: 0.4, delay: sessionStarted ? 0.3 : 0, ease: 'easeOut' }}
            >
              <div className="relative z-10 w-full max-w-3xl mx-auto">
                {appConfig.isPreConnectBufferEnabled && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{
                      opacity: sessionStarted && messages.length === 0 ? 1 : 0,
                      scale: sessionStarted && messages.length === 0 ? 1 : 0.95,
                      transition: {
                        ease: 'easeOut',
                        delay: messages.length > 0 ? 0 : 0.6,
                        duration: messages.length > 0 ? 0.2 : 0.4,
                      },
                    }}
                    aria-hidden={messages.length > 0}
                    className={cn(
                      'mb-3 text-center',
                      sessionStarted && messages.length === 0 && 'pointer-events-none'
                    )}
                  >
                    <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 backdrop-blur-sm">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-purple-400"></div>
                      <p className="text-sm font-medium text-purple-200">
                        AI Assistant is ready to help you find the perfect book
                      </p>
                    </div>
                  </motion.div>
                )}

                <div className="rounded-2xl border border-border/50 bg-card/80 shadow-xl backdrop-blur-xl p-2">
                  <AgentControlBar
                    capabilities={capabilities}
                    onChatOpenChange={setChatOpen}
                    onSendMessage={handleSendMessage}
                    onDisconnect={handleDisconnect}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Scroll to Bottom Button */}
          <motion.div
            className="absolute right-6 bottom-28 z-40"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: showScrollToBottom ? 1 : 0,
              scale: showScrollToBottom ? 1 : 0.8,
            }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Button
              onClick={() => {
                if (chatScrollRef.current) {
                  chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
                }
              }}
              className="h-10 w-10 rounded-full border border-primary/30 bg-background/90 text-primary shadow-lg hover:bg-primary hover:text-white transition-all"
              size="sm"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
