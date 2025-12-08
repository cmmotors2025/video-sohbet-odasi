import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, ArrowLeft, Users, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/VideoPlayer';
import { ChatBox } from '@/components/ChatBox';
import { UsernamePrompt } from '@/components/UsernamePrompt';
import { useRoom } from '@/hooks/useRoom';
import { useChat } from '@/hooks/useChat';
import { getUsername } from '@/lib/user';
import { toast } from '@/hooks/use-toast';

const Room = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [needsUsername, setNeedsUsername] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    room,
    videoState,
    loading: roomLoading,
    error: roomError,
    isOwner,
    updateVideoUrl,
    updatePlaybackState,
    seekTo,
  } = useRoom(code || '');

  const {
    messages,
    loading: chatLoading,
    sendMessage,
    userId,
  } = useChat(room?.id);

  useEffect(() => {
    const username = getUsername();
    if (!username) {
      setNeedsUsername(true);
    }
  }, []);

  const handleCopyCode = async () => {
    if (code) {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: 'Kopyalandı!',
        description: 'Oda kodu panoya kopyalandı',
      });
      setTimeout(() => setCopied(false), 2000));
    }
  };

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

  if (needsUsername) {
    return <UsernamePrompt onComplete={() => setNeedsUsername(false)} />;
  }

  return (
    <div className="min-h-screen cinema-gradient flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-3 border-b border-border/30">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/30">
            <span className="text-sm font-medium tracking-wider">{code}</span>
            <Button
              onClick={handleCopyCode}
              variant="ghost"
              size="icon"
              className="w-6 h-6 text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="w-4 h-4" />
          <span className="text-xs">
            {isOwner ? 'Oda Sahibi' : 'İzleyici'}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Video Section */}
        <div className="p-3">
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

        {/* Chat Section */}
        <div className="flex-1 p-3 pt-0 min-h-0">
          <ChatBox
            messages={messages}
            currentUserId={userId}
            onSendMessage={sendMessage}
            loading={chatLoading}
          />
        </div>
      </main>
    </div>
  );
};

export default Room;
