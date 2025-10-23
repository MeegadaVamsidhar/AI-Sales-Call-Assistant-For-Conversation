'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Welcome } from '@/components/welcome';
import { SessionView } from '@/components/session-view';
import { motion } from 'motion/react';
import { Room, RoomEvent } from 'livekit-client';
import { RoomAudioRenderer, RoomContext, StartAudio } from '@livekit/components-react';
import { toastAlert } from '@/components/alert-toast';
import { Toaster } from '@/components/ui/sonner';
import useConnectionDetails from '@/hooks/useConnectionDetails';
import type { AppConfig } from '@/lib/types';

const MotionWelcome = motion.create(Welcome);
const MotionSessionView = motion.create(SessionView);

const appConfig: AppConfig = {
  pageTitle: 'BookWise - AI Sales Assistant',
  pageDescription: 'AI-powered book consultation and ordering assistant',
  companyName: 'BookWise',
  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: true,
  isPreConnectBufferEnabled: true,
  logo: '/logo.svg',
  startButtonText: 'CLICK HERE TO CONNECT'
};

function isAgentAvailable(agentState: any) {
  return agentState == 'listening' || agentState == 'thinking' || agentState == 'speaking';
}

export default function Page() {
  const searchParams = useSearchParams();
  const [showSession, setShowSession] = useState(false);
  const room = useMemo(() => new Room(), []);
  const [sessionStarted, setSessionStarted] = useState(false);
  const { refreshConnectionDetails, existingOrRefreshConnectionDetails } =
    useConnectionDetails(appConfig);

  // Check if we should show session from URL params
  useEffect(() => {
    const session = searchParams?.get('session');
    if (session === 'true') {
      setShowSession(true);
      setSessionStarted(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const onDisconnected = () => {
      setSessionStarted(false);
      refreshConnectionDetails();
    };
    const onMediaDevicesError = (error: Error) => {
      toastAlert({
        title: 'Encountered an error with your media devices',
        description: `${error.name}: ${error.message}`,
      });
    };
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);
    room.on(RoomEvent.Disconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    };
  }, [room, refreshConnectionDetails]);

  useEffect(() => {
    let aborted = false;
    if (sessionStarted && room.state === 'disconnected') {
      Promise.all([
        room.localParticipant.setMicrophoneEnabled(true, undefined, {
          preConnectBuffer: appConfig.isPreConnectBufferEnabled,
        }),
        existingOrRefreshConnectionDetails().then((connectionDetails) =>
          room.connect(connectionDetails.serverUrl, connectionDetails.participantToken)
        ),
      ]).catch((error) => {
        if (aborted) {
          return;
        }

        toastAlert({
          title: 'There was an error connecting to the agent',
          description: `${error.name}: ${error.message}`,
        });
      });
    }
    return () => {
      aborted = true;
      room.disconnect();
    };
  }, [room, sessionStarted, appConfig.isPreConnectBufferEnabled]);

  const handleStartCall = () => {
    console.log('handleStartCall called');
    setShowSession(true);
    setSessionStarted(true);
  };

  const handleBackToHome = () => {
    setShowSession(false);
    setSessionStarted(false);
    room.disconnect();
  };

  if (showSession) {
    return (
      <main className="h-screen overflow-hidden">
        <RoomContext.Provider value={room}>
          <RoomAudioRenderer />
          <StartAudio label="Start Audio" />
          
          <MotionSessionView
            key="session-view"
            appConfig={appConfig}
            disabled={false}
            sessionStarted={sessionStarted}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.5,
              ease: 'linear',
            }}
          />
        </RoomContext.Provider>

        <Toaster />
      </main>
    );
  }

  // Show home page
  return (
    <main>
      <MotionWelcome
        key="welcome"
        startButtonText={appConfig.startButtonText}
        onStartCall={handleStartCall}
        disabled={false}
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: 'linear' }}
      />
      <Toaster />
    </main>
  );
}
