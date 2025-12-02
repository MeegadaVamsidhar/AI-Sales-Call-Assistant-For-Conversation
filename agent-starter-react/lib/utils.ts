import { cache } from 'react';
import { type ClassValue, clsx } from 'clsx';
import { Room } from 'livekit-client';
import { twMerge } from 'tailwind-merge';
import type { ReceivedChatMessage, TextStreamData } from '@livekit/components-react';
import { APP_CONFIG_DEFAULTS } from '@/app-config';
import type { AppConfig, SandboxConfig } from './types';

export const CONFIG_ENDPOINT = process.env.NEXT_PUBLIC_APP_CONFIG_ENDPOINT;
export const SANDBOX_ID = process.env.SANDBOX_ID;

export const THEME_STORAGE_KEY = 'theme-mode';
export const THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function transcriptionToChatMessage(
  textStream: TextStreamData,
  room: Room
): ReceivedChatMessage {
  try {
    console.log('Transcription Debug - FULL STREAM INFO:', {
      text: textStream.text.substring(0, 50),
      participantInfo: textStream.participantInfo,
      streamInfo: textStream.streamInfo,
      localIdentity: room.localParticipant.identity,
    });

    // Get all track information for debugging
    const localAudioTracks = Array.from(room.localParticipant.audioTrackPublications.values());
    const remoteAudioTracks = Array.from(room.remoteParticipants.values()).flatMap(p =>
      Array.from(p.audioTrackPublications.values())
    );

    console.log('Track Debug:', {
      localAudioTracks: localAudioTracks.map(t => ({ sid: t.trackSid, name: t.trackName })),
      remoteAudioTracks: remoteAudioTracks.map(t => ({ sid: t.trackSid, name: t.trackName })),
      transcriptionTrackSid: textStream.streamInfo.trackSid,
    });

    // Check if transcription is from local participant by identity
    const isFromLocalParticipant =
      textStream.participantInfo.identity === room.localParticipant.identity;

    // Check if the trackSid matches any of the local participant's audio tracks
    const isLocalAudio = localAudioTracks.some(track =>
      track.trackSid === textStream.streamInfo.trackSid
    ) ?? false;

    // In voice assistants, the agent transcribes user speech, so we need to check
    // if the track being transcribed belongs to the local user
    const fromLocal = isFromLocalParticipant || isLocalAudio;

    // Find the correct participant to attribute the message to
    const fromParticipant = fromLocal
      ? room.localParticipant
      : Array.from(room.remoteParticipants.values()).find(
        (p) => p.identity === textStream.participantInfo.identity
      );

    console.log('Transcription Debug - DECISION:', {
      text: textStream.text.substring(0, 30),
      isFromLocalParticipant,
      isLocalAudio,
      fromLocal,
      attributedTo: fromParticipant?.identity,
      shouldBeUser: fromLocal,
    });

    return {
      id: textStream.streamInfo.id,
      timestamp: textStream.streamInfo.timestamp,
      message: textStream.text,
      from: fromParticipant,
    };
  } catch (error) {
    console.error('Error in transcriptionToChatMessage:', error);
    // Fallback - return with participant from textStream info
    return {
      id: textStream.streamInfo.id,
      timestamp: textStream.streamInfo.timestamp,
      message: textStream.text,
      from: Array.from(room.remoteParticipants.values()).find(
        (p) => p.identity === textStream.participantInfo.identity
      ) || room.localParticipant,
    };
  }
}

// https://react.dev/reference/react/cache#caveats
// > React will invalidate the cache for all memoized functions for each server request.
export const getAppConfig = cache(async (headers: Headers): Promise<AppConfig> => {
  if (CONFIG_ENDPOINT) {
    const sandboxId = SANDBOX_ID ?? headers.get('x-sandbox-id') ?? '';

    try {
      if (!sandboxId) {
        throw new Error('Sandbox ID is required');
      }

      const response = await fetch(CONFIG_ENDPOINT, {
        cache: 'no-store',
        headers: { 'X-Sandbox-ID': sandboxId },
      });

      const remoteConfig: SandboxConfig = await response.json();
      const config: AppConfig = { sandboxId, ...APP_CONFIG_DEFAULTS };

      for (const [key, entry] of Object.entries(remoteConfig)) {
        if (entry === null) continue;
        // Only include app config entries that are declared in defaults and, if set,
        // share the same primitive type as the default value.
        if (
          (key in APP_CONFIG_DEFAULTS &&
            APP_CONFIG_DEFAULTS[key as keyof AppConfig] === undefined) ||
          (typeof config[key as keyof AppConfig] === entry.type &&
            typeof config[key as keyof AppConfig] === typeof entry.value)
        ) {
          // @ts-expect-error I'm not sure quite how to appease TypeScript, but we've thoroughly checked types above
          config[key as keyof AppConfig] = entry.value as AppConfig[keyof AppConfig];
        }
      }

      return config;
    } catch (error) {
      console.error('ERROR: getAppConfig() - lib/utils.ts', error);
    }
  }

  return APP_CONFIG_DEFAULTS;
});
