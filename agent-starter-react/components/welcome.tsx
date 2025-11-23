'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Award, BookOpen, Clock, Library, Mic, Phone, Sparkles, Star, Users, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Card } from '@/app/components/ui/Card';

interface WelcomeProps {
  disabled: boolean;
  startButtonText: string;
  onStartCall: (userName?: string) => void;
}

export const Welcome = ({
  disabled,
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeProps) => {
  const router = useRouter();
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [userName, setUserName] = useState('');

  const handleStartCallClick = () => {
    setShowNameDialog(true);
  };

  const handleNameSubmit = () => {
    if (userName.trim()) {
      setShowNameDialog(false);
      onStartCall(userName.trim());
    }
  };

  const handleSkip = () => {
    setShowNameDialog(false);
    onStartCall();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-primary)',
      position: 'relative',
      overflow: 'auto'
    }}>
      {/* Animated gradient background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        opacity: 0.4,
        zIndex: 0
      }}>
        <div className="animate-blob" style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '50%',
          height: '50%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--gradient-primary-start), transparent)',
          filter: 'blur(80px)',
        }}></div>
        <div className="animate-blob animation-delay-2000" style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: '45%',
          height: '45%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--gradient-primary-end), transparent)',
          filter: 'blur(80px)',
          animationDelay: '2s'
        }}></div>
        <div className="animate-blob animation-delay-4000" style={{
          position: 'absolute',
          top: '40%',
          left: '40%',
          width: '35%',
          height: '35%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--color-primary), transparent)',
          filter: 'blur(80px)',
          animationDelay: '4s'
        }}></div>
      </div>

      {/* Main Content */}
      <main style={{ position: 'relative', zIndex: 10 }}>
        {/* Hero Section - Full Screen */}
        <div style={{
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-8) var(--space-4)',
          width: '100%'
        }}>
          <div style={{ width: '100%', textAlign: 'center' }}>
            {/* Badge */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-8)',
                marginBottom: 'var(--space-8)',
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--glass-blur)',
                border: '2px solid var(--glass-border)',
                borderRadius: 'var(--radius-full)',
                boxShadow: '0 8px 32px rgba(124, 77, 255, 0.15)'
              }}>
              <Sparkles style={{
                width: '24px',
                height: '24px',
                color: 'var(--gradient-primary-end)',
                filter: 'drop-shadow(0 0 8px var(--gradient-primary-end))'
              }} />
              <span style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-semibold)',
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>AI-Powered Book Assistant</span>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{
                fontSize: 'clamp(3rem, 8vw, 7rem)',
                fontWeight: 'var(--font-weight-extrabold)',
                marginBottom: 'var(--space-6)',
                lineHeight: 1.1,
                letterSpacing: '-0.02em'
              }}
            >
              <span style={{
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 4px 20px rgba(124, 77, 255, 0.3))'
              }}>
                BookWise
              </span>
              <span style={{
                color: 'var(--color-text-primary)',
                marginLeft: 'var(--space-4)'
              }}>AI</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-6)',
                letterSpacing: '-0.01em'
              }}
            >
              Intelligent Book Consultation
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              style={{
                maxWidth: '800px',
                margin: '0 auto',
                fontSize: 'var(--font-size-xl)',
                lineHeight: 'var(--line-height-relaxed)',
                color: 'var(--color-text-tertiary)',
                marginBottom: 'var(--space-12)'
              }}
            >
              Discover your perfect next read with our AI-powered assistant. Get personalized
              recommendations, detailed reviews, and seamless ordering - all through natural
              conversation.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Button
                variant="primary"
                size="large"
                onClick={handleStartCallClick}
                disabled={disabled}
                style={{
                  fontSize: 'var(--font-size-lg)',
                  padding: 'var(--space-6) var(--space-12)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  boxShadow: '0 10px 40px rgba(124, 77, 255, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                }}
              >
                <Mic size={28} />
                {startButtonText}
                <Zap size={24} style={{ marginLeft: 'var(--space-2)' }} />
              </Button>
              <p style={{
                marginTop: 'var(--space-4)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)'
              }}>✨ Click to start your personalized book discovery journey</p>
            </motion.div>
          </div>
        </div>

        {/* Features Section - Below the fold */}
        <div style={{ padding: 'var(--space-16) var(--space-6)', maxWidth: '1400px', margin: '0 auto' }}>
          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-6)',
              marginBottom: 'var(--space-12)'
            }}
          >
            <motion.div whileHover={{ y: -8, scale: 1.02 }} transition={{ duration: 0.2 }}>
              <Card accent="green" interactive variant="spacious" style={{ padding: 'var(--space-6)' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '60px',
                  height: '60px',
                  borderRadius: 'var(--radius-xl)',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: 'var(--shadow-success)',
                  marginBottom: 'var(--space-4)'
                }}>
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--space-2)'
                }}>Smart Recommendations</h3>
                <p style={{
                  lineHeight: 'var(--line-height-normal)',
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-sm)'
                }}>
                  Advanced AI analyzes your reading preferences, past purchases, and reviews to
                  suggest books you'll absolutely love.
                </p>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -8, scale: 1.02 }} transition={{ duration: 0.2 }}>
              <Card accent="purple" interactive variant="spacious" style={{ padding: 'var(--space-6)' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '60px',
                  height: '60px',
                  borderRadius: 'var(--radius-xl)',
                  background: 'var(--gradient-primary)',
                  boxShadow: 'var(--shadow-primary)',
                  marginBottom: 'var(--space-4)'
                }}>
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--space-2)'
                }}>Expert Consultation</h3>
                <p style={{
                  lineHeight: 'var(--line-height-normal)',
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-sm)'
                }}>
                  Chat naturally with our AI assistant for detailed book information, reviews, and
                  personalized reading advice.
                </p>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -8, scale: 1.02 }} transition={{ duration: 0.2 }}>
              <Card accent="pink" interactive variant="spacious" style={{ padding: 'var(--space-6)' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '60px',
                  height: '60px',
                  borderRadius: 'var(--radius-xl)',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)',
                  boxShadow: '0 10px 30px rgba(245, 158, 11, 0.4)',
                  marginBottom: 'var(--space-4)'
                }}>
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--space-2)'
                }}>Instant Ordering</h3>
                <p style={{
                  lineHeight: 'var(--line-height-normal)',
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-sm)'
                }}>
                  Seamlessly place orders with multiple payment options, delivery choices, and
                  real-time order tracking.
                </p>
              </Card>
            </motion.div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            style={{
              borderRadius: 'var(--radius-2xl)',
              background: 'var(--gradient-primary)',
              padding: 'var(--space-12) var(--space-8)',
              textAlign: 'center',
              color: 'white',
              boxShadow: '0 20px 60px rgba(124, 77, 255, 0.4)',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: 'var(--space-12)'
            }}
          >
            {/* Shine effect */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              animation: 'shine 3s infinite'
            }}></div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-10)',
              position: 'relative'
            }}>
              <div>
                <div style={{
                  fontSize: 'var(--font-size-5xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  marginBottom: 'var(--space-3)',
                  textShadow: '0 2px 20px rgba(0,0,0,0.2)'
                }}>10,000+</div>
                <div style={{
                  opacity: 0.95,
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-medium)'
                }}>Books Available</div>
              </div>
              <div>
                <div style={{
                  fontSize: 'var(--font-size-5xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  marginBottom: 'var(--space-3)',
                  textShadow: '0 2px 20px rgba(0,0,0,0.2)'
                }}>5,000+</div>
                <div style={{
                  opacity: 0.95,
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-medium)'
                }}>Happy Customers</div>
              </div>
              <div>
                <div style={{
                  fontSize: 'var(--font-size-5xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  marginBottom: 'var(--space-3)',
                  textShadow: '0 2px 20px rgba(0,0,0,0.2)'
                }}>24/7</div>
                <div style={{
                  opacity: 0.95,
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-medium)'
                }}>AI Support</div>
              </div>
            </div>
          </motion.div>

          {/* Help text */}
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontSize: 'var(--font-size-base)',
              color: 'var(--color-text-tertiary)'
            }}>
              Need help finding the perfect book?{' '}
              <button
                type="button"
                onClick={handleStartCallClick}
                style={{
                  fontWeight: 'var(--font-weight-semibold)',
                  background: 'var(--gradient-primary)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textDecoration: 'underline',
                  textUnderlineOffset: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Start consultation call
              </button>
              .
            </p>
          </div>
        </div>
      </main>

      {/* Name Input Modal */}
      <Modal
        isOpen={showNameDialog}
        onClose={() => setShowNameDialog(false)}
        title={
          <span style={{
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)'
          }}>
            Welcome to BookWise! 👋
          </span>
        }
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)', width: '100%' }}>
            <Button
              variant="primary"
              onClick={handleNameSubmit}
              disabled={!userName.trim()}
              style={{ flex: 1 }}
            >
              Continue
            </Button>
            <Button
              variant="secondary"
              onClick={handleSkip}
              style={{ flex: 1 }}
            >
              Skip
            </Button>
          </div>
        }
      >
        <p style={{
          fontSize: 'var(--font-size-base)',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--space-6)'
        }}>
          What should we call you? This helps our AI assistant personalize your experience.
        </p>
        <Input
          placeholder="Enter your name..."
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && userName.trim()) {
              handleNameSubmit();
            }
          }}
          autoFocus
        />
      </Modal>

      <style jsx>{`
        @keyframes shine {
          to {
            left: 100%;
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
      `}</style>
    </div>
  );
};
