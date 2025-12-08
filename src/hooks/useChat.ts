import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserId, getUsername } from '@/lib/user';

interface Message {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
  image_url?: string | null;
}

export const useChat = (roomId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  
  const userId = getUserId();

  const fetchMessages = useCallback(async () => {
    if (!roomId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`messages_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('New message:', payload);
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const sendSystemMessage = useCallback(async (content: string) => {
    if (!roomId) return;

    await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        user_id: 'system',
        username: 'Sistem',
        content,
        image_url: null,
      });
  }, [roomId]);

  const sendMessage = async (content: string, imageFile?: File) => {
    if (!roomId || (!content.trim() && !imageFile)) return;

    const username = getUsername();
    let imageUrl: string | null = null;

    // Upload image if provided
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${roomId}/${userId}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, imageFile);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('chat-images')
          .getPublicUrl(uploadData.path);
        
        imageUrl = publicUrlData.publicUrl;
      }
    }
    
    const { error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        user_id: userId,
        username: username || 'Anonim',
        content: content.trim(),
        image_url: imageUrl,
      });

    if (error) {
      console.error('Error sending message:', error);
    }
  };

  const clearMessages = useCallback(async () => {
    if (!roomId) return;

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('room_id', roomId);

    if (error) {
      console.error('Error clearing messages:', error);
    } else {
      setMessages([]);
    }
  }, [roomId]);

  return {
    messages,
    loading,
    sendMessage,
    sendSystemMessage,
    clearMessages,
    userId,
  };
};