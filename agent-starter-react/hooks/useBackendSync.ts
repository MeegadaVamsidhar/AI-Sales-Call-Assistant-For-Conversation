import { useEffect, useRef } from 'react';
import { type ReceivedChatMessage, useRoomContext } from '@livekit/components-react';

export default function useBackendSync(messages: ReceivedChatMessage[]) {
  const room = useRoomContext();
  const sentIdsRef = useRef<Set<string>>(new Set());
  const pendingTimersRef = useRef<Map<string, any>>(new Map());
  const lastMessageRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
    const roomId = (room as any)?.name || (room as any)?.room?.name || 'unknown-room';

    const toSend = messages.filter((m) => !sentIdsRef.current.has(m.id));
    if (toSend.length === 0) return;

    toSend.forEach(async (m) => {
      try {
        // Determine role based on participant type and message metadata
        // In LiveKit agents, we need to check multiple indicators
        const fromIdentity = m.from?.identity || '';
        const fromName = m.from?.name || '';
        
        // Check if this is from the local participant
        const isLocalParticipant = m.from?.identity === room.localParticipant.identity || 
                                    m.from?.sid === room.localParticipant.sid ||
                                    m.from?.isLocal === true;
        
        // Check if this is from an agent (common agent identities)
        const isAgentParticipant = fromIdentity.toLowerCase().includes('agent') ||
                                   fromIdentity.toLowerCase().includes('assistant') ||
                                   fromName.toLowerCase().includes('agent') ||
                                   fromName.toLowerCase().includes('assistant');
        
        // Determine if this is a user message:
        // 1. If it's from local participant, it's definitely a user message
        // 2. If it's from a remote participant that's NOT an agent, it's a user message
        const isUserMessage = isLocalParticipant || !isAgentParticipant;
        
        const assignedRole = isUserMessage ? 'user' : 'assistant';
        
        // Debug logging
        console.log('useBackendSync - Message attribution:', {
          messageId: m.id,
          message: m.message,
          fromIdentity: m.from?.identity,
          fromName: m.from?.name,
          fromSid: m.from?.sid,
          fromIsLocal: m.from?.isLocal,
          localIdentity: room.localParticipant.identity,
          localSid: room.localParticipant.sid,
          isLocalParticipant,
          isAgentParticipant,
          isUserMessage,
          assignedRole
        });
        
        const existingTimer = pendingTimersRef.current.get(m.id);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
        lastMessageRef.current.set(m.id, m.message);

        const timeoutId = setTimeout(async () => {
          const finalMessage = lastMessageRef.current.get(m.id) || m.message;
          const payload = {
            room_id: roomId,
            item: {
              id: m.id,
              role: assignedRole,
              message: finalMessage,
              timestamp: m.timestamp / 1000,
            },
          };

          await fetch(`${backendBase}/process-transcription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          sentIdsRef.current.add(m.id);
          pendingTimersRef.current.delete(m.id);
          lastMessageRef.current.delete(m.id);
        }, 800);

        pendingTimersRef.current.set(m.id, timeoutId as any);
      } catch (err) {
        // Ignore errors to avoid impacting UI
        // Consider exponential backoff in production
      }
    });
  }, [messages, room]);
}
