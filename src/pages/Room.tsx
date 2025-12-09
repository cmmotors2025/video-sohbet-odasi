import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/VideoPlayer';
import { ChatBox } from '@/components/ChatBox';
import { VoiceControls } from '@/components/VoiceControls';
import { ParticipantsDialog } from '@/components/ParticipantsDialog';
import { SpeakingAvatars } from '@/components/SpeakingAvatars';
import { useRoom } from '@/hooks/useRoom';
import { useChat } from '@/hooks/useChat';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { useRoomPresence } from '@/hooks/useRoomPresence';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const Room = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [participantsOpen, setParticipantsOpen] = useState(false);
  
  const { user, profile } = useAuth();

  const {
    room,
    videoState,
    loading: roomLoading,
    error: roomError,
    isOwner,
    updateVideoUrl,
    updatePlaybackState,
    seekTo,
  } = useRoom(code || '', user?.id);

  const {
    messages,
    loading: chatLoading,
    sendMessage,
    sendSystemMessage,
    clearMessages,
    userId,
  } = useChat(room?.id, profile, user?.id);

  // Room presence for tracking all users in the room
  const { participants: presenceParticipants, trackSpeakingStatus } = useRoomPresence({
    roomCode: code || '',
    userId: user?.id,
    username: profile?.username,
    avatarUrl: profile?.avatar_url,
  });

  const handleParticipantJoin = useCallback((name: string) => {
    sendSystemMessage(`${name} katıldı`);
  }, [sendSystemMessage]);

  const {
    isConnected: voiceConnected,
    isConnecting: voiceConnecting,
    isMicEnabled,
    participants: voiceParticipants,
    error: voiceError,
    connect: connectVoice,
    disconnect: disconnectVoice,
    toggleMic,
  } = useVoiceChat(code, room?.id, handleParticipantJoin, profile?.username);

  // Broadcast mic status to presence when it changes
  useEffect(() => {
    if (voiceConnected) {
      trackSpeakingStatus(isMicEnabled);
    }
  }, [isMicEnabled, voiceConnected, trackSpeakingStatus]);

  if (roomLoading) {
    return (
      <div className="min-h-screen cinema-gradient flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (roomError || !room) {
    return (
      <div className="min-h-screen cinema-gradient flex flex-col items-center justify-center p-6">
        <p className="text-destructive mb-4">{roomError || 'Oda bulunamadı'}</p>
        <Button onClick={() => navigate('/')} variant="secondary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Ana Sayfaya Dön
        </Button>
      </div>
    );
  }

  const currentUser = {
    id: user?.id || '',
    username: profile?.username || 'Anonim',
    avatar_url: profile?.avatar_url || null,
  };

  return (
    <div className="h-[100dvh] cinema-gradient flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-3 py-2 mt-6 border-b border-border/30">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Speaking avatars in center */}
        <SpeakingAvatars
          participants={presenceParticipants}
          currentUserMicEnabled={isMicEnabled && voiceConnected}
          currentUserAvatar={profile?.avatar_url || null}
          currentUserUsername={profile?.username || 'Anonim'}
          onClick={() => setParticipantsOpen(true)}
        />

        <div className="flex items-center gap-2">
          <VoiceControls
            isConnected={voiceConnected}
            isConnecting={voiceConnecting}
            isMicEnabled={isMicEnabled}
            participantCount={presenceParticipants.size + 1}
            error={voiceError}
            onToggleMic={toggleMic}
            onConnect={connectVoice}
            onDisconnect={disconnectVoice}
            onOpenParticipants={() => setParticipantsOpen(true)}
          />
        </div>
      </header>

      {/* Participants Dialog */}
      <ParticipantsDialog
        participants={presenceParticipants}
        isOwner={isOwner}
        currentUser={currentUser}
        isMicEnabled={isMicEnabled}
        isConnected={voiceConnected}
        roomCode={code || ''}
        open={participantsOpen}
        onOpenChange={setParticipantsOpen}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Video Section - takes more space */}
        <div className="flex-[3] min-h-0 px-2 pt-6">
          <VideoPlayer
            videoUrl={videoState?.video_url || null}
            isPlaying={videoState?.is_playing || false}
            playbackTime={videoState?.playback_time || 0}
            isOwner={isOwner}
            onUpdateUrl={updateVideoUrl}
            onPlayPause={updatePlaybackState}
            onSeek={seekTo}
            lastUpdated={videoState?.updated_at || null}
          />
        </div>

        {/* Chat Section - smaller, max height */}
        <div className="flex-[2] min-h-0 max-h-[35vh] px-2 pt-1 pb-2 flex flex-col">
          <ChatBox
            messages={messages}
            currentUserId={userId || ''}
            onSendMessage={sendMessage}
            onClearMessages={clearMessages}
            isOwner={isOwner}
            loading={chatLoading}
          />
        </div>
      </main>
    </div>
  );
};

export default Room;
