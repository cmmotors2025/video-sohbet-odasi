import { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, RotateCcw, RotateCw, Link, Loader2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface VideoPlayerProps {
  videoUrl: string | null;
  isPlaying: boolean;
  playbackTime: number;
  isOwner: boolean;
  onUpdateUrl: (url: string) => void;
  onPlayPause: (isPlaying: boolean, currentTime: number) => void;
  onSeek: (time: number) => void;
  lastUpdated: string | null;
}

export const VideoPlayer = ({
  videoUrl,
  isPlaying,
  playbackTime,
  isOwner,
  onUpdateUrl,
  onPlayPause,
  onSeek,
  lastUpdated,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Calculate smart sync time for new joiners
  const calculateSyncTime = () => {
    let targetTime = playbackTime;
    if (isPlaying && lastUpdated) {
      const elapsed = (Date.now() - new Date(lastUpdated).getTime()) / 1000;
      targetTime = playbackTime + elapsed;
    }
    return targetTime;
  };

  // Initialize HLS
  useEffect(() => {
    if (!videoUrl || !videoRef.current) return;

    setIsLoading(true);

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(videoUrl);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (videoRef.current) {
          // Smart sync: calculate real-time position for new joiners
          const targetTime = calculateSyncTime();
          videoRef.current.currentTime = targetTime;
          if (isPlaying) {
            videoRef.current.play().catch(console.error);
          }
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error('HLS Error:', data);
        setIsLoading(false);
      });

      hlsRef.current = hls;
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = videoUrl;
      videoRef.current.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        if (videoRef.current) {
          const targetTime = calculateSyncTime();
          videoRef.current.currentTime = targetTime;
          if (isPlaying) {
            videoRef.current.play().catch(console.error);
          }
        }
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [videoUrl]);

  // Visibility change handler - resume when coming back from background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && videoRef.current && videoUrl) {
        const video = videoRef.current;
        const targetTime = calculateSyncTime();
        const timeDiff = Math.abs(video.currentTime - targetTime);

        // Sync if more than 1 second difference
        if (timeDiff > 1) {
          video.currentTime = targetTime;
        }

        // Resume playback if it should be playing
        if (isPlaying && video.paused) {
          video.play().catch(console.error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [playbackTime, isPlaying, lastUpdated, videoUrl]);

  // Owner: periodically update playback position
  useEffect(() => {
    if (!isOwner || !videoRef.current || !videoUrl) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused && isPlaying) {
        onSeek(video.currentTime);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isOwner, isPlaying, onSeek, videoUrl]);

  // Sync playback state from owner
  useEffect(() => {
    if (!videoRef.current || isOwner || syncInProgress) return;

    setSyncInProgress(true);

    const video = videoRef.current;
    const targetTime = calculateSyncTime();
    const timeDiff = Math.abs(video.currentTime - targetTime);

    // Sync if time difference is more than 2 seconds
    if (timeDiff > 2) {
      video.currentTime = targetTime;
    }

    if (isPlaying && video.paused) {
      video.play().catch(console.error);
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }

    setTimeout(() => setSyncInProgress(false), 100);
  }, [isPlaying, playbackTime, isOwner, lastUpdated]);

  const handlePlayPause = () => {
    if (!videoRef.current || !isOwner) return;
    
    const video = videoRef.current;
    const newIsPlaying = video.paused;
    
    if (newIsPlaying) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
    
    onPlayPause(newIsPlaying, video.currentTime);
  };

  const handleSeek = (seconds: number) => {
    if (!videoRef.current || !isOwner) return;
    
    const video = videoRef.current;
    const newTime = Math.max(0, video.currentTime + seconds);
    video.currentTime = newTime;
    onSeek(newTime);
  };

  const handleAddUrl = () => {
    if (urlInput.trim()) {
      onUpdateUrl(urlInput.trim());
      setUrlInput('');
      setDialogOpen(false);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="relative w-full bg-cinema-dark rounded-lg overflow-hidden">
      {/* Video Container */}
      <div className="relative aspect-video bg-cinema-dark">
        {!videoUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center">
              <Play className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              {isOwner ? 'Video eklemek için aşağıdaki butonu kullanın' : 'Video bekleniyor...'}
            </p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              playsInline
              webkit-playsinline="true"
              x5-playsinline="true"
            />
            {/* Fullscreen Button - Always visible */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFullscreen}
              className="absolute top-2 right-2 text-foreground/70 hover:text-foreground hover:bg-secondary/50"
            >
              <Maximize2 className="w-5 h-5" />
            </Button>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-cinema-dark/80">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      {isOwner && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-cinema-dark via-cinema-dark/90 to-transparent">
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSeek(-10)}
              disabled={!videoUrl}
              className="text-foreground/80 hover:text-foreground hover:bg-secondary/50"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPause}
              disabled={!videoUrl}
              className="w-12 h-12 rounded-full bg-primary/20 text-primary hover:bg-primary/30 glow-primary"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSeek(10)}
              disabled={!videoUrl}
              className="text-foreground/80 hover:text-foreground hover:bg-secondary/50"
            >
              <RotateCw className="w-5 h-5" />
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground/80 hover:text-foreground hover:bg-secondary/50"
                >
                  <Link className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-surface border-border/50">
                <DialogHeader>
                  <DialogTitle>Video URL Ekle</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 pt-4">
                  <Input
                    placeholder="m3u8 link yapıştırın..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="bg-input border-border/50"
                  />
                  <Button onClick={handleAddUrl} className="w-full">
                    Videoyu Yükle
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
    </div>
  );
};
