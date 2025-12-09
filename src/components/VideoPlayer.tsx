import { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, RotateCcw, RotateCw, Link, Loader2, Maximize2, Eye, EyeOff, PictureInPicture2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
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
  const [controlsVisible, setControlsVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPiP, setIsPiP] = useState(false);

  // Calculate smart sync time for new joiners only
  const calculateSyncTime = (forInitialSync = false) => {
    // Only add elapsed time for initial sync of new joiners
    if (forInitialSync && isPlaying && lastUpdated) {
      const elapsed = (Date.now() - new Date(lastUpdated).getTime()) / 1000;
      // Cap elapsed time to prevent jumping too far ahead
      const cappedElapsed = Math.min(elapsed, 10);
      return playbackTime + cappedElapsed;
    }
    return playbackTime;
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
          const targetTime = calculateSyncTime(true);
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
          const targetTime = calculateSyncTime(true);
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

  // Track current time and duration for progress bar (owner only)
  useEffect(() => {
    if (!videoRef.current || !isOwner) return;
    
    const video = videoRef.current;
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };
    
    const handleDurationChange = () => {
      setDuration(video.duration);
    };
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('durationchange', handleDurationChange);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('durationchange', handleDurationChange);
    };
  }, [videoUrl, isOwner]);

  // Track last explicit owner action timestamp to detect real updates
  const lastOwnerActionRef = useRef<string | null>(null);

  // Sync playback state from owner ONLY when owner makes explicit action
  // Owner actions: play/pause button, seek button - these update lastUpdated
  useEffect(() => {
    if (!videoRef.current || isOwner) return;
    
    // Only sync if lastUpdated changed (owner made an explicit action)
    if (lastUpdated === lastOwnerActionRef.current) {
      return; // No new owner action, don't sync
    }
    
    // This is a new owner action
    lastOwnerActionRef.current = lastUpdated;
    
    const video = videoRef.current;
    
    // Sync time position
    video.currentTime = playbackTime;
    
    // Sync play/pause state
    if (isPlaying && video.paused) {
      video.play().catch(console.error);
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
  }, [lastUpdated, isPlaying, playbackTime, isOwner]);

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

  const handleSliderSeek = (value: number[]) => {
    if (!videoRef.current || !isOwner) return;
    
    const video = videoRef.current;
    const newTime = value[0];
    video.currentTime = newTime;
    onSeek(newTime);
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '00:00';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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

  const handlePiP = async () => {
    if (!videoRef.current) return;
    
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP Error:', error);
    }
  };

  // PiP event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnterPiP = () => setIsPiP(true);
    const handleLeavePiP = () => setIsPiP(false);

    video.addEventListener('enterpictureinpicture', handleEnterPiP);
    video.addEventListener('leavepictureinpicture', handleLeavePiP);

    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPiP);
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, [videoUrl]);

  return (
    <div className="relative w-full bg-cinema-dark rounded-lg overflow-hidden">
      {/* Video Container */}
      <div className="relative aspect-[4/3] bg-cinema-dark">
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
            {/* PiP & Fullscreen Buttons - Always visible */}
            <div className="absolute top-2 right-2 flex gap-1">
              {document.pictureInPictureEnabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePiP}
                  className={`text-foreground/70 hover:text-foreground hover:bg-secondary/50 ${isPiP ? 'text-primary' : ''}`}
                  title="Mini Oynatıcı"
                >
                  <PictureInPicture2 className="w-5 h-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFullscreen}
                className="text-foreground/70 hover:text-foreground hover:bg-secondary/50"
                title="Tam Ekran"
              >
                <Maximize2 className="w-5 h-5" />
              </Button>
            </div>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-cinema-dark/80">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls Toggle Button - Owner only */}
      {isOwner && videoUrl && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setControlsVisible(!controlsVisible)}
          className="absolute top-2 left-2 text-foreground/70 hover:text-foreground hover:bg-secondary/50 z-10"
        >
          {controlsVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </Button>
      )}

      {/* Controls */}
      {isOwner && controlsVisible && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-cinema-dark via-cinema-dark/90 to-transparent">
          {/* Progress Bar */}
          {videoUrl && duration > 0 && (
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="text-xs text-foreground/70 min-w-[40px]">{formatTime(currentTime)}</span>
              <Slider
                value={[currentTime]}
                max={duration}
                step={1}
                onValueChange={handleSliderSeek}
                className="flex-1"
              />
              <span className="text-xs text-foreground/70 min-w-[40px] text-right">{formatTime(duration)}</span>
            </div>
          )}
          
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
