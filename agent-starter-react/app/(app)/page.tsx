'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Room, RoomEvent } from 'livekit-client';
import { motion } from 'motion/react';
import { RoomAudioRenderer, RoomContext, StartAudio } from '@livekit/components-react';
import { toastAlert } from '@/components/alert-toast';
import { SessionView } from '@/components/session-view';
import { Toaster } from '@/components/ui/sonner';
import { Welcome } from '@/components/welcome';
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
  accent: '#4F46E5', // Indigo accent color for light mode
  logoDark: '/logo.svg', // Same logo for dark mode (or use a different one if available)
  accentDark: '#818CF8', // Lighter indigo for dark mode
  startButtonText: 'CLICK HERE TO CONNECT',
};

function isAgentAvailable(agentState: any) {
  return agentState == 'listening' || agentState == 'thinking' || agentState == 'speaking';
}

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showSession, setShowSession] = useState(false);
  const room = useMemo(() => new Room(), []);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const { refreshConnectionDetails, existingOrRefreshConnectionDetails } =
    useConnectionDetails(appConfig, userName);

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

      // Try multiple sources for room ID with fallbacks
      const currentRoomId = roomId || room.name || localStorage.getItem('lastRoomId');

      console.log('Call disconnected. Room ID:', currentRoomId);
      console.log('Sources - State:', roomId, 'Room.name:', room.name, 'LocalStorage:', localStorage.getItem('lastRoomId'));

      // Redirect to call summary page if we have a room ID
      if (currentRoomId) {
        console.log('Redirecting to call summary page:', `/call-summary/${currentRoomId}`);
        router.push(`/call-summary/${currentRoomId}`);
      } else {
        console.warn('No room ID available for redirect to summary page');
        toastAlert({
          title: 'Unable to load summary',
          description: 'Room ID was not captured. Please try again.',
        });
      }
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
  }, [room, refreshConnectionDetails, roomId, router]);

  useEffect(() => {
    let aborted = false;
    if (sessionStarted && room.state === 'disconnected') {
      Promise.all([
        room.localParticipant.setMicrophoneEnabled(true, undefined, {
          preConnectBuffer: appConfig.isPreConnectBufferEnabled,
        }),
        existingOrRefreshConnectionDetails().then((connectionDetails) => {
          return room.connect(connectionDetails.serverUrl, connectionDetails.participantToken).then(() => {
            // Store the room name after connecting
            if (room.name) {
              console.log('Room connected. Setting room ID:', room.name);
              setRoomId(room.name);
            }
          });
        }),
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

  // Additional effect to track room state changes and capture room name
  useEffect(() => {
    const onConnected = () => {
      if (room.name && !roomId) {
        console.log('Room connected event. Capturing room ID:', room.name);
        setRoomId(room.name);
        // Store in localStorage as backup
        localStorage.setItem('lastRoomId', room.name);
      }
    };

    room.on(RoomEvent.Connected, onConnected);

    return () => {
      room.off(RoomEvent.Connected, onConnected);
    };
  }, [room, roomId]);

  const handleStartCall = (name?: string) => {
    console.log('handleStartCall called', name ? `with name: ${name}` : 'without name');
    if (name) {
      setUserName(name);
      // Store in localStorage for persistence
      localStorage.setItem('userName', name);
    }
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
