'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  type AgentState,
  type ReceivedChatMessage,
  useRoomContext,
  useVoiceAssistant,
} from '@livekit/components-react';
import { toastAlert } from '@/components/alert-toast';
import { Button } from '@/components/ui/button';
import { Mic, FileText, Calendar, BookOpen, Star, ShoppingCart, User, ChevronDown, X } from 'lucide-react';
import { AgentControlBar } from '@/components/livekit/agent-control-bar/agent-control-bar';
import { ChatEntry } from '@/components/livekit/chat/chat-entry';
import { ChatMessageView } from '@/components/livekit/chat/chat-message-view';
import useChatAndTranscription from '@/hooks/useChatAndTranscription';
import { useDebugMode } from '@/hooks/useDebug';
import type { AppConfig } from '@/lib/types';
import { cn } from '@/lib/utils';
import useBackendSync from '@/hooks/useBackendSync';
import useOrderData from '@/hooks/useOrderData';

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
  const [activeTab, setActiveTab] = useState('book-recommendations');
  // Get real-time order data from backend
  const { orderData: backendOrderData, loading: orderLoading, error: orderError } = useOrderData();
  
  // Local state for manual edits (if needed)
  const [localOrderData, setLocalOrderData] = useState({
    customerName: '',
    contactId: '',
    bookTitle: '',
    author: '',
    genre: '',
    quantity: '1',
    paymentMethod: 'Credit Card',
    deliveryOption: 'Home Delivery',
    specialRequests: ''
  });
  
  // Merge backend data with local data (backend takes priority)
  const orderData = {
    customerName: backendOrderData.customer_name || localOrderData.customerName,
    contactId: backendOrderData.customer_id || localOrderData.contactId,
    bookTitle: backendOrderData.book_title || localOrderData.bookTitle,
    author: backendOrderData.author || localOrderData.author,
    genre: backendOrderData.genre || localOrderData.genre,
    quantity: backendOrderData.quantity?.toString() || localOrderData.quantity,
    paymentMethod: backendOrderData.payment_method || localOrderData.paymentMethod,
    deliveryOption: backendOrderData.delivery_option || localOrderData.deliveryOption,
    specialRequests: backendOrderData.special_requests || localOrderData.specialRequests
  };
  const [callEnded, setCallEnded] = useState(false);
  const [userSentiment, setUserSentiment] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const chatScrollRef = React.useRef<HTMLDivElement>(null);
  const [detectedOrder, setDetectedOrder] = useState<any>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackData, setFeedbackData] = useState({ rating: 0, experience: '', suggestions: '' });
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  
  // Note: Order extraction is now handled by the backend
  // Real-time order data is fetched via useOrderData hook
  
  // Function to display order confirmation in chat
  const displayOrderConfirmation = () => {
    const orderDetails = {
      bookTitle: orderData.bookTitle || 'Selected Book',
      author: orderData.author || 'Unknown Author',
      quantity: orderData.quantity || '1',
      paymentMethod: orderData.paymentMethod || 'Credit Card',
      deliveryOption: orderData.deliveryOption || 'Home Delivery',
      customerName: orderData.customerName || 'Customer'
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

  // Handle call disconnect and show feedback dialog
  const handleDisconnect = () => {
    setShowFeedbackDialog(true);
  };

  // Handle order submission
  const handleOrderSubmit = async () => {
    if (!orderData.bookTitle || !orderData.customerName || !orderData.contactId) {
      toastAlert({
        title: 'Incomplete Order',
        description: 'Please ensure book title, customer name, and contact ID are filled.'
      });
      return;
    }

    try {
      setOrderSubmitting(true);
      
      // Submit order to backend
      const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
      const roomId = (room as any)?.name || (room as any)?.room?.name;
      
      const orderPayload = {
        ...orderData,
        order_status: 'confirmed',
        order_date: new Date().toISOString()
      };
      
      const response = await fetch(`${backendBase}/orders/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: roomId,
          order_data: orderPayload
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setOrderSubmitted(true);
        
        toastAlert({
          title: 'Order Submitted Successfully!',
          description: `Order ID: ${result.order_id || 'Generated'}. You will receive a confirmation shortly.`
        });
        
        // Send confirmation message to chat
        await send(`Order confirmed! Order details: ${orderData.bookTitle} by ${orderData.author}, Quantity: ${orderData.quantity}, Total: $${orderData.quantity ? (parseFloat(orderData.quantity) * 15.99).toFixed(2) : '15.99'}`);
      } else {
        throw new Error('Failed to submit order');
      }
    } catch (error) {
      console.error('Order submission error:', error);
      toastAlert({
        title: 'Order Submission Failed',
        description: 'Please try again or contact support.'
      });
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (feedback: { rating: number; experience: string; suggestions: string }) => {
    try {
      // Here you could send feedback to your backend
      console.log('Feedback submitted:', feedback);
      
      setShowFeedbackDialog(false);
      
      // Show thank you message
      toastAlert({
        title: 'Thank you!',
        description: 'Your feedback helps us improve our AI assistant.'
      });
      
      // Redirect to home page after feedback
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toastAlert({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.'
      });
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
  
  // Log backend order data for debugging
  useEffect(() => {
    if (backendOrderData && Object.keys(backendOrderData).length > 0) {
      console.log('Backend order data updated:', backendOrderData);
    }
  }, [backendOrderData]);

  const { supportsChatInput, supportsVideoInput, supportsScreenShare } = appConfig;
  const capabilities = {
    supportsChatInput,
    supportsVideoInput,
    supportsScreenShare,
  };

  return (
    <section ref={ref} inert={disabled} className={cn('opacity-100 w-full bg-gradient-to-br from-blue-50 via-purple-50/50 to-pink-50/30')}>
      {/* Main Split Container */}
      <div className="flex h-screen w-full overflow-hidden p-4 gap-4">
        {/* Left Panel - Book Order Details */}
        <div className="w-1/2 flex flex-col bg-gradient-to-br from-white/90 via-blue-50/30 to-purple-50/20 backdrop-blur-sm rounded-2xl shadow-xl border border-gradient-to-r from-blue-200/50 to-purple-200/50 overflow-hidden">
          <div className="sticky top-0 p-6 bg-gradient-to-r from-white/95 via-blue-50/80 to-purple-50/80 backdrop-blur-sm border-b border-gradient-to-r from-blue-200/50 to-purple-200/50 z-40 rounded-t-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Order Details</h2>
                <p className="text-sm text-gray-600">AI-powered order management</p>
              </div>
              {(backendOrderData.customer_name || backendOrderData.book_title || backendOrderData.customer_id || backendOrderData.author) && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-700">Auto-filled</span>
                </div>
              )}
              <button 
                onClick={() => setLocalOrderData({
                  customerName: '',
                  contactId: '',
                  bookTitle: '',
                  author: '',
                  genre: '',
                  quantity: '1',
                  paymentMethod: 'Credit Card',
                  deliveryOption: 'Home Delivery',
                  specialRequests: ''
                })}
                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-gray-100 to-blue-50 text-gray-600 hover:from-blue-100 hover:to-purple-100 hover:text-gray-800 rounded-xl transition-all duration-200 border border-gray-200"
                title="Clear manually entered data (auto-filled data will remain)"
              >
                Clear Manual
              </button>
            </div>
          </div>
          <div className="flex-1 p-6 overflow-hidden relative">
            {/* Loading Overlay */}
            {orderLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
                <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-lg border">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-gray-700">Extracting order details...</span>
                </div>
              </div>
            )}
            
            {/* Error State */}
            {orderError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">Failed to sync with backend: {orderError}</p>
              </div>
            )}
            
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={orderData.customerName}
                      onChange={(e) => setLocalOrderData(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder={backendOrderData.customer_name ? "Auto-filled from conversation" : "Enter customer name"}
                      className={cn(
                        "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                        backendOrderData.customer_name 
                          ? "bg-green-50 border-green-200 text-green-800" 
                          : "bg-white border-gray-300"
                      )}
                    />
                    {backendOrderData.customer_name && (
                      <div className="absolute right-2 top-2 w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer ID (Phone)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={orderData.contactId}
                      onChange={(e) => setLocalOrderData(prev => ({ ...prev, contactId: e.target.value }))}
                      placeholder={backendOrderData.customer_id ? "Auto-filled from conversation" : "Enter phone number"}
                      className={cn(
                        "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                        backendOrderData.customer_id 
                          ? "bg-green-50 border-green-200 text-green-800" 
                          : "bg-white border-gray-300"
                      )}
                    />
                    {backendOrderData.customer_id && (
                      <div className="absolute right-2 top-2 w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Book Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Book Title
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={orderData.bookTitle}
                      onChange={(e) => setLocalOrderData(prev => ({ ...prev, bookTitle: e.target.value }))}
                      placeholder={backendOrderData.book_title ? "Auto-filled from conversation" : "Enter book title"}
                      className={cn(
                        "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                        backendOrderData.book_title 
                          ? "bg-green-50 border-green-200 text-green-800" 
                          : "bg-white border-gray-300"
                      )}
                    />
                    {backendOrderData.book_title && (
                      <div className="absolute right-2 top-2 w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Author
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={orderData.author}
                      onChange={(e) => setLocalOrderData(prev => ({ ...prev, author: e.target.value }))}
                      placeholder={backendOrderData.author ? "Auto-filled from conversation" : "Enter author name"}
                      className={cn(
                        "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                        backendOrderData.author 
                          ? "bg-green-50 border-green-200 text-green-800" 
                          : "bg-white border-gray-300"
                      )}
                    />
                    {backendOrderData.author && (
                      <div className="absolute right-2 top-2 w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Genre and Quantity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Genre
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={orderData.genre}
                      onChange={(e) => setLocalOrderData(prev => ({ ...prev, genre: e.target.value }))}
                      placeholder={backendOrderData.genre ? "Auto-filled from conversation" : "Fiction, Non-fiction, etc."}
                      className={cn(
                        "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                        backendOrderData.genre 
                          ? "bg-green-50 border-green-200 text-green-800" 
                          : "bg-white border-gray-300"
                      )}
                    />
                    {backendOrderData.genre && (
                      <div className="absolute right-2 top-2 w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={orderData.quantity}
                      onChange={(e) => setLocalOrderData(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder={backendOrderData.quantity ? "Auto-filled from conversation" : "1"}
                      min="1"
                      className={cn(
                        "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                        backendOrderData.quantity 
                          ? "bg-green-50 border-green-200 text-green-800" 
                          : "bg-white border-gray-300"
                      )}
                    />
                    {backendOrderData.quantity && (
                      <div className="absolute right-2 top-2 w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Payment and Delivery */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <div className="relative">
                    <select
                      value={orderData.paymentMethod}
                      onChange={(e) => setLocalOrderData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className={cn(
                        "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                        backendOrderData.payment_method 
                          ? "bg-green-50 border-green-200 text-green-800" 
                          : "bg-white border-gray-300"
                      )}
                    >
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                    </select>
                    {backendOrderData.payment_method && (
                      <div className="absolute right-8 top-2 w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Option
                  </label>
                  <div className="relative">
                    <select
                      value={orderData.deliveryOption}
                      onChange={(e) => setLocalOrderData(prev => ({ ...prev, deliveryOption: e.target.value }))}
                      className={cn(
                        "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                        backendOrderData.delivery_option 
                          ? "bg-green-50 border-green-200 text-green-800" 
                          : "bg-white border-gray-300"
                      )}
                    >
                      <option value="Home Delivery">Home Delivery</option>
                      <option value="Store Pickup">Store Pickup</option>
                      <option value="Express Delivery">Express Delivery</option>
                    </select>
                    {backendOrderData.delivery_option && (
                      <div className="absolute right-8 top-2 w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Requests
                </label>
                <div className="relative">
                  <textarea
                    value={orderData.specialRequests}
                    onChange={(e) => setLocalOrderData(prev => ({ ...prev, specialRequests: e.target.value }))}
                    placeholder={backendOrderData.special_requests ? "Auto-filled from conversation" : "Any special requests or notes..."}
                    className={cn(
                      "w-full h-16 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all",
                      backendOrderData.special_requests 
                        ? "bg-green-50 border-green-200 text-green-800" 
                        : "bg-white border-gray-300"
                    )}
                  />
                  {backendOrderData.special_requests && (
                    <div className="absolute right-2 top-2 w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
              </div>
              
              {/* Order Action Button */}
              {(orderData.bookTitle && orderData.customerName && orderData.contactId) && (
                <div className="mt-6 space-y-4">
                  <div className="flex gap-3">
                    <button
                      onClick={handleOrderSubmit}
                      disabled={orderSubmitting || orderSubmitted}
                      className={cn(
                        "flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2",
                        orderSubmitted 
                          ? "bg-green-500 cursor-not-allowed"
                          : orderSubmitting
                          ? "bg-blue-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:scale-105"
                      )}
                    >
                      {orderSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Submitting Order...
                        </>
                      ) : orderSubmitted ? (
                        <>
                          <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          </div>
                          Order Submitted!
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4" />
                          Submit Order
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Order Preview */}
                  <div className="p-3 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg text-sm">
                    <div className="font-medium text-gray-800 mb-1">Order Preview:</div>
                    <div className="text-gray-600">
                      <span className="font-medium">{orderData.bookTitle}</span>
                      {orderData.author && <span> by {orderData.author}</span>}
                      <br />
                      Quantity: {orderData.quantity || 1} | 
                      Payment: {orderData.paymentMethod} | 
                      Delivery: {orderData.deliveryOption}
                      <br />
                      <span className="font-semibold text-blue-600">
                        Total: ${orderData.quantity ? (parseFloat(orderData.quantity) * 15.99).toFixed(2) : '15.99'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Order Summary */}
              {(backendOrderData.order_id || backendOrderData.total_amount) && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Order Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    {backendOrderData.order_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order ID:</span>
                        <span className="font-medium text-gray-900">{backendOrderData.order_id}</span>
                      </div>
                    )}
                    {backendOrderData.unit_price && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Unit Price:</span>
                        <span className="font-medium text-gray-900">${backendOrderData.unit_price}</span>
                      </div>
                    )}
                    {backendOrderData.quantity && backendOrderData.unit_price && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-medium text-gray-900">{backendOrderData.quantity} × ${backendOrderData.unit_price}</span>
                      </div>
                    )}
                    {backendOrderData.total_amount && (
                      <div className="flex justify-between pt-2 border-t border-blue-200">
                        <span className="font-semibold text-blue-900">Total Amount:</span>
                        <span className="font-bold text-blue-900">${backendOrderData.total_amount}</span>
                      </div>
                    )}
                    {backendOrderData.order_status && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          backendOrderData.order_status === 'pending' ? "bg-yellow-100 text-yellow-800" :
                          backendOrderData.order_status === 'confirmed' ? "bg-green-100 text-green-800" :
                          "bg-gray-100 text-gray-800"
                        )}>
                          {backendOrderData.order_status.charAt(0).toUpperCase() + backendOrderData.order_status.slice(1)}
                        </span>
                      </div>
                    )}
                    {backendOrderData.order_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Date:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(backendOrderData.order_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Live Transcription */}
        <div className="w-1/2 flex flex-col min-h-0 overflow-hidden bg-gradient-to-br from-white via-blue-50/20 to-purple-50/20 relative rounded-2xl shadow-xl border border-gradient-to-r from-blue-200/30 to-purple-200/30">
          {/* Chat Messages Container */}
          <div className="flex-1 bg-gradient-to-br from-white/95 via-blue-50/10 to-purple-50/10 flex flex-col min-h-0 rounded-2xl">
            <ChatMessageView 
              className="flex-1 overflow-y-auto space-y-4 scrollbar-hide"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
              onScroll={(e) => {
                const target = e.target as HTMLElement;
                const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
                setShowControls(isAtBottom);
                setShowScrollToBottom(!isAtBottom);
              }}
              ref={chatScrollRef}
            >
              {/* Modern Chat Header */}
              <div className="p-6 bg-gradient-to-r from-white/95 via-blue-50/80 to-purple-50/80 backdrop-blur-sm border-b border-gradient-to-r from-blue-200/50 to-purple-200/50 rounded-t-2xl">
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-2xl">🤖</span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">AI ASSISTANT</h2>
                      <p className="text-sm text-gray-600 font-medium">Ready to help with your book needs</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Modern Voice Controls */}
              <div className="bg-gradient-to-r from-white/90 via-blue-50/60 to-purple-50/60 backdrop-blur-sm border-b border-gradient-to-r from-blue-200/50 to-purple-200/50 p-4 sticky top-0 z-40">
                <motion.div
                  key="control-bar"
                  initial={{ opacity: 0, translateY: '-20px' }}
                  animate={{
                    opacity: sessionStarted ? 1 : 0,
                    translateY: sessionStarted ? '0px' : '-20px',
                  }}
                  transition={{ duration: 0.4, delay: sessionStarted ? 0.3 : 0, ease: 'easeOut' }}
                >
                  <div className="relative z-10 w-full">
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
                          'text-center mb-3',
                          sessionStarted && messages.length === 0 && 'pointer-events-none'
                        )}
                      >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-blue-100">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <p className="text-sm font-medium text-blue-700">
                            AI Assistant is ready to help you find the perfect book
                          </p>
                        </div>
                      </motion.div>
                    )}

                    <div className="bg-gradient-to-r from-white/90 to-blue-50/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-gradient-to-r from-blue-200/50 to-purple-200/50">
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
              
              <div className="p-4">
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🤖</span>
                      </div>
                      <p className="text-sm text-gray-600">Hello there! How can I help</p>
                    </div>
                  </div>
                )}
                {messages.map((message, index) => {
                  // Check multiple possible user identifiers
                  const userName = message.from?.name || message.from?.identity || '';
                  const isUser = userName === 'You' || userName === 'User' || userName === 'user' || message.from?.isLocal === true;
                  const speakerName = isUser ? 'You' : 'AI Assistant';
                  
                  // Debug log to help identify the issue
                  console.log('Message:', { userName, isLocal: message.from?.isLocal, isUser, message: message.message });
                  return (
                    <div key={index} className={cn(
                      "flex flex-col mb-4",
                      isUser ? "items-end" : "items-start"
                    )}>
                      {/* Speaker Label */}
                      <div className={cn(
                        "text-xs font-medium mb-1 px-2",
                        isUser ? "text-blue-600" : "text-gray-600"
                      )}>
                        {speakerName}
                      </div>
                      
                      {/* Message Bubble */}
                      <div className={cn(
                        "max-w-[70%] px-4 py-3 rounded-lg shadow-sm",
                        isUser 
                          ? "bg-blue-500 text-white rounded-br-sm" 
                          : "bg-gray-100 text-gray-900 border border-gray-200 rounded-bl-sm"
                      )}>
                        <p className="text-sm leading-relaxed break-words">{message.message}</p>
                        
                        {/* Timestamp */}
                        <div className={cn(
                          "text-xs mt-1 opacity-70",
                          isUser ? "text-blue-100" : "text-gray-500"
                        )}>
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Order Confirmation Display */}
                {detectedOrder && (
                  <div className="flex flex-col mb-4 items-start">
                    <div className="text-xs font-medium mb-1 px-2 text-green-600">
                      BookWise AI - Order Assistant
                    </div>
                    <div className="max-w-[80%] px-4 py-3 rounded-lg shadow-sm bg-green-50 border border-green-200 rounded-bl-sm">
                      <div className="text-sm font-semibold text-green-800 mb-2">
                        📚 Order Detected!
                      </div>
                      <p className="text-sm leading-relaxed break-words text-green-700 whitespace-pre-line">
                        {detectedOrder.message}
                      </p>
                      <div className="text-xs mt-2 opacity-70 text-green-600">
                        {new Date(detectedOrder.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button 
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                          onClick={() => {
                            console.log('Order confirmed:', orderData);
                            setDetectedOrder(null);
                          }}
                        >
                          Confirm Order
                        </button>
                        <button 
                          className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-400 transition-colors"
                          onClick={() => setDetectedOrder(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ChatMessageView>
          </div>
          
          {/* Scroll to Bottom Button */}
          <motion.div
            className="absolute bottom-4 right-4 z-40"
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
              className="h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg border-2 border-white"
              size="sm"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </motion.div>
          
        </div>
      </div>
      
      {/* Feedback Dialog */}
      {showFeedbackDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">How was your experience?</h2>
                  <p className="text-sm text-gray-600 mt-1">Help us improve our AI assistant</p>
                </div>
                <button
                  onClick={() => {
                    setShowFeedbackDialog(false);
                    window.location.href = '/';
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (feedbackData.rating > 0) {
                  handleFeedbackSubmit(feedbackData);
                } else {
                  // If no rating, just go to home
                  window.location.href = '/';
                }
              }} className="space-y-6">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Rate your experience
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackData(prev => ({ ...prev, rating: star }))}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "h-8 w-8 transition-colors",
                            feedbackData.rating >= star
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  {feedbackData.rating > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      {feedbackData.rating === 1 && "Poor - We'll work on improving"}
                      {feedbackData.rating === 2 && "Fair - There's room for improvement"}
                      {feedbackData.rating === 3 && "Good - Thanks for your feedback"}
                      {feedbackData.rating === 4 && "Very Good - We're glad you enjoyed it"}
                      {feedbackData.rating === 5 && "Excellent - Thank you for the great rating!"}
                    </p>
                  )}
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tell us about your experience
                  </label>
                  <textarea
                    value={feedbackData.experience}
                    onChange={(e) => setFeedbackData(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="What did you like or dislike about the conversation?"
                    className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Suggestions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Suggestions for improvement (optional)
                  </label>
                  <textarea
                    value={feedbackData.suggestions}
                    onChange={(e) => setFeedbackData(prev => ({ ...prev, suggestions: e.target.value }))}
                    placeholder="How can we make the AI assistant better?"
                    className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white transition-all duration-300"
                  >
                    {feedbackData.rating > 0 ? 'Submit Feedback' : 'Continue to Home'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};