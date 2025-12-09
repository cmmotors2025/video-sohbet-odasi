import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RoomParticipant {
  id: string;
  username: string;
  avatar_url: string | null;
  isSpeaking?: boolean;
}

interface UseRoomPresenceProps {
  roomCode: string;
  userId: string | undefined;
  username: string | undefined;
  avatarUrl: string | null | undefined;
}

export const useRoomPresence = ({
  roomCode,
  userId,
  username,
  avatarUrl,
}: UseRoomPresenceProps) => {
  const [participants, setParticipants] = useState<Map<string, RoomParticipant>>(new Map());
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!roomCode || !userId || !username) return;

    const roomChannel = supabase.channel(`room-presence:${roomCode}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const state = roomChannel.presenceState();
        const newParticipants = new Map<string, RoomParticipant>();

        Object.entries(state).forEach(([key, presences]) => {
          if (presences && presences.length > 0) {
            const presence = presences[0] as unknown as RoomParticipant;
            if (presence.id !== userId) {
              newParticipants.set(key, {
                id: presence.id,
                username: presence.username,
                avatar_url: presence.avatar_url,
                isSpeaking: false,
              });
            }
          }
        });

        setParticipants(newParticipants);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (newPresences && newPresences.length > 0) {
          const presence = newPresences[0] as unknown as RoomParticipant;
          if (presence.id !== userId) {
            setParticipants((prev) => {
              const updated = new Map(prev);
              updated.set(key, {
                id: presence.id,
                username: presence.username,
                avatar_url: presence.avatar_url,
                isSpeaking: false,
              });
              return updated;
            });
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setParticipants((prev) => {
          const updated = new Map(prev);
          updated.delete(key);
          return updated;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await roomChannel.track({
            id: userId,
            username: username,
            avatar_url: avatarUrl || null,
          });
        }
      });

    setChannel(roomChannel);

    return () => {
      roomChannel.untrack();
      supabase.removeChannel(roomChannel);
    };
  }, [roomCode, userId, username, avatarUrl]);

  const updateSpeakingStatus = useCallback((oderId: string, isSpeaking: boolean) => {
    setParticipants((prev) => {
      const updated = new Map(prev);
      const participant = Array.from(updated.entries()).find(
        ([_, p]) => p.id === oderId
      );
      if (participant) {
        updated.set(participant[0], {
          ...participant[1],
          isSpeaking,
        });
      }
      return updated;
    });
  }, []);

  return {
    participants,
    updateSpeakingStatus,
  };
};
