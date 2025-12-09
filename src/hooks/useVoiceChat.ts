import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  Participant,
  RemoteParticipant,
  LocalParticipant,
  ConnectionState,
} from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';

interface VoiceChatState {
  isConnected: boolean;
  isConnecting: boolean;
  isMicEnabled: boolean;
  participants: Map<string, { name: string; isSpeaking: boolean }>;
  error: string | null;
}

type OnParticipantJoinCallback = (name: string) => void;

export const useVoiceChat = (
  roomCode: string | undefined,
  roomId: string | undefined,
  onParticipantJoin?: OnParticipantJoinCallback,
  username?: string
) => {
  const [state, setState] = useState<VoiceChatState>({
    isConnected: false,
    isConnecting: false,
    isMicEnabled: false,
    participants: new Map(),
    error: null,
  });

  const roomRef = useRef<Room | null>(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const onParticipantJoinRef = useRef<OnParticipantJoinCallback | undefined>(onParticipantJoin);

  useEffect(() => {
    onParticipantJoinRef.current = onParticipantJoin;
  }, [onParticipantJoin]);

  // Connect to LiveKit room
  const connect = useCallback(async () => {
    if (!roomCode || state.isConnected || state.isConnecting) return;

    if (!username) {
      setState(prev => ({ ...prev, error: 'Kullanıcı adı gerekli' }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Get token from edge function
      const { data, error } = await supabase.functions.invoke('livekit-token', {
        body: { roomCode, odaId: roomId, username },
      });

      if (error) {
        throw new Error(error.message || 'Token alınamadı');
      }

      if (!data?.token || !data?.url) {
        throw new Error('Geçersiz token yanıtı');
      }

      console.log('LiveKit token received, connecting...');

      // Create and connect to room
      const room = new Room({
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      roomRef.current = room;

      // Set up event listeners
      room.on(RoomEvent.Connected, () => {
        console.log('Connected to LiveKit room');
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
        }));
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('Disconnected from LiveKit room');
        setState(prev => ({
          ...prev,
          isConnected: false,
          isMicEnabled: false,
          participants: new Map(),
        }));
      });

      room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        console.log('Participant connected:', participant.identity);
        const participantName = participant.name || participant.identity;
        
        // Notify about new participant
        if (onParticipantJoinRef.current) {
          onParticipantJoinRef.current(participantName);
        }
        
        setState(prev => {
          const newParticipants = new Map(prev.participants);
          newParticipants.set(participant.identity, {
            name: participantName,
            isSpeaking: false,
          });
          return { ...prev, participants: newParticipants };
        });
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        console.log('Participant disconnected:', participant.identity);
        // Clean up audio element
        const audioEl = audioElementsRef.current.get(participant.identity);
        if (audioEl) {
          audioEl.srcObject = null;
          audioEl.remove();
          audioElementsRef.current.delete(participant.identity);
        }

        setState(prev => {
          const newParticipants = new Map(prev.participants);
          newParticipants.delete(participant.identity);
          return { ...prev, participants: newParticipants };
        });
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
        setState(prev => {
          const newParticipants = new Map(prev.participants);
          // Reset all speaking states
          newParticipants.forEach((value, key) => {
            newParticipants.set(key, { ...value, isSpeaking: false });
          });
          // Set speaking state for active speakers
          speakers.forEach(speaker => {
            const existing = newParticipants.get(speaker.identity);
            if (existing) {
              newParticipants.set(speaker.identity, { ...existing, isSpeaking: true });
            }
          });
          return { ...prev, participants: newParticipants };
        });
      });

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          console.log('Audio track subscribed from:', participant.identity);
          const audioEl = track.attach();
          audioEl.id = `audio-${participant.identity}`;
          document.body.appendChild(audioEl);
          audioElementsRef.current.set(participant.identity, audioEl);
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          console.log('Audio track unsubscribed from:', participant.identity);
          const audioEl = audioElementsRef.current.get(participant.identity);
          if (audioEl) {
            track.detach(audioEl);
            audioEl.remove();
            audioElementsRef.current.delete(participant.identity);
          }
        }
      });

      // Connect to room
      await room.connect(data.url, data.token);

      // Add existing participants
      room.remoteParticipants.forEach((participant) => {
        setState(prev => {
          const newParticipants = new Map(prev.participants);
          newParticipants.set(participant.identity, {
            name: participant.name || participant.identity,
            isSpeaking: false,
          });
          return { ...prev, participants: newParticipants };
        });
      });

    } catch (error) {
      console.error('Error connecting to LiveKit:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Bağlantı hatası',
      }));
    }
  }, [roomCode, roomId, username, state.isConnected, state.isConnecting]);

  // Disconnect from LiveKit room
  const disconnect = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    // Clean up all audio elements
    audioElementsRef.current.forEach((audioEl) => {
      audioEl.srcObject = null;
      audioEl.remove();
    });
    audioElementsRef.current.clear();

    setState({
      isConnected: false,
      isConnecting: false,
      isMicEnabled: false,
      participants: new Map(),
      error: null,
    });
  }, []);

  // Toggle microphone
  const toggleMic = useCallback(async () => {
    if (!roomRef.current) return;

    try {
      const room = roomRef.current;
      const localParticipant = room.localParticipant;

      if (state.isMicEnabled) {
        // Disable microphone
        await localParticipant.setMicrophoneEnabled(false);
        setState(prev => ({ ...prev, isMicEnabled: false }));
      } else {
        // Enable microphone
        await localParticipant.setMicrophoneEnabled(true);
        setState(prev => ({ ...prev, isMicEnabled: true }));
      }
    } catch (error) {
      console.error('Error toggling microphone:', error);
      setState(prev => ({
        ...prev,
        error: 'Mikrofon açılamadı',
      }));
    }
  }, [state.isMicEnabled]);

  // Auto-connect when room code AND username are available
  useEffect(() => {
    if (roomCode && username && !state.isConnected && !state.isConnecting) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [roomCode, username]);

  return {
    ...state,
    connect,
    disconnect,
    toggleMic,
  };
};
