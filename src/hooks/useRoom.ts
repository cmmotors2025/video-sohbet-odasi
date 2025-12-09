import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Room {
  id: string;
  code: string;
  owner_id: string;
  created_at: string;
}

interface VideoState {
  id: string;
  room_id: string;
  video_url: string | null;
  is_playing: boolean;
  playback_time: number;
  updated_at: string;
}

export const useRoom = (roomCode: string, userId: string | undefined) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [videoState, setVideoState] = useState<VideoState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isOwner = room?.owner_id === userId;

  const fetchRoom = useCallback(async () => {
    try {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', roomCode)
        .maybeSingle();

      if (roomError) throw roomError;
      if (!roomData) {
        setError('Oda bulunamadı');
        setLoading(false);
        return;
      }

      setRoom(roomData);

      const { data: stateData, error: stateError } = await supabase
        .from('video_state')
        .select('*')
        .eq('room_id', roomData.id)
        .maybeSingle();

      if (stateError) throw stateError;
      setVideoState(stateData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching room:', err);
      setError('Oda yüklenirken hata oluştu');
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  useEffect(() => {
    if (!room) return;

    const channel = supabase
      .channel(`video_state_${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'video_state',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          console.log('Video state update:', payload);
          if (payload.new) {
            setVideoState(payload.new as VideoState);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room]);

  const updateVideoUrl = async (url: string) => {
    if (!room || !isOwner) return;

    const { error } = await supabase
      .from('video_state')
      .upsert({
        room_id: room.id,
        video_url: url,
        is_playing: false,
        playback_time: 0,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'room_id',
      });

    if (error) {
      console.error('Error updating video URL:', error);
    }
  };

  const updatePlaybackState = async (isPlaying: boolean, currentTime: number) => {
    if (!room || !isOwner) return;

    const { error } = await supabase
      .from('video_state')
      .update({
        is_playing: isPlaying,
        playback_time: currentTime,
        updated_at: new Date().toISOString(),
      })
      .eq('room_id', room.id);

    if (error) {
      console.error('Error updating playback state:', error);
    }
  };

  const seekTo = async (time: number) => {
    if (!room || !isOwner) return;

    const { error } = await supabase
      .from('video_state')
      .update({
        playback_time: time,
        updated_at: new Date().toISOString(),
      })
      .eq('room_id', room.id);

    if (error) {
      console.error('Error seeking:', error);
    }
  };

  return {
    room,
    videoState,
    loading,
    error,
    isOwner,
    updateVideoUrl,
    updatePlaybackState,
    seekTo,
  };
};
