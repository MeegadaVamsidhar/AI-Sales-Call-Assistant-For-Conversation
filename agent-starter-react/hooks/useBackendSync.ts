import { useEffect, useRef } from 'react';
import { useRoomContext, type ReceivedChatMessage } from '@livekit/components-react';

export default function useBackendSync(messages: ReceivedChatMessage[]) {
  const room = useRoomContext();
  const sentIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
    const roomId = (room as any)?.name || (room as any)?.room?.name || 'unknown-room';

    const toSend = messages.filter((m) => !sentIdsRef.current.has(m.id));
    if (toSend.length === 0) return;

    toSend.forEach(async (m) => {
      try {
        const payload = {
          room_id: roomId,
          item: {
            id: m.id,
            role: m.from?.identity === room.localParticipant.identity ? 'user' : 'assistant',
            message: m.message,
            timestamp: m.timestamp / 1000,
          },
        };

        await fetch(`${backendBase}/process-transcription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        sentIdsRef.current.add(m.id);
      } catch (err) {
        // Ignore errors to avoid impacting UI
        // Consider exponential backoff in production
      }
    });
  }, [messages, room]);
}


