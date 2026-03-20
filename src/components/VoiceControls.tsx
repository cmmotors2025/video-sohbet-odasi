import { Mic, MicOff, Loader2, PhoneOff, MonitorUp, MonitorOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VoiceControlsProps {
  isConnected: boolean;
  isConnecting: boolean;
  isMicEnabled: boolean;
  isScreenSharing: boolean;
  participantCount: number;
  error: string | null;
  onToggleMic: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onOpenParticipants: () => void;
  onStartScreenShare: () => void;
  onStopScreenShare: () => void;
}

export const VoiceControls = ({
  isConnected,
  isConnecting,
  isMicEnabled,
  isScreenSharing,
  participantCount,
  error,
  onToggleMic,
  onConnect,
  onDisconnect,
  onOpenParticipants,
  onStartScreenShare,
  onStopScreenShare,
}: VoiceControlsProps) => {
  // Bağlanıyor durumu
  if (isConnecting) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-secondary/50 border border-border/30">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">Bağlanıyor...</span>
      </div>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onConnect}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
            >
              <PhoneOff className="w-4 h-4 mr-1" />
              Tekrar Dene
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{error}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Henüz bağlanmadı
  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-secondary/50 border border-border/30">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">Bağlanıyor...</span>
      </div>
    );
  }

  // Bağlı durumu
  return (
    <div className="flex items-center gap-1">
      {/* Screen Share Toggle */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={isScreenSharing ? onStopScreenShare : onStartScreenShare}
              className={`${
                isScreenSharing
                  ? 'text-destructive hover:text-destructive hover:bg-destructive/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {isScreenSharing ? (
                <MonitorOff className="w-4 h-4" />
              ) : (
                <MonitorUp className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isScreenSharing ? 'Paylaşımı durdur' : 'Ekran paylaş'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Mic Toggle */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleMic}
              className={`${
                isMicEnabled
                  ? 'text-primary hover:text-primary hover:bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {isMicEnabled ? (
                <Mic className="w-4 h-4" />
              ) : (
                <MicOff className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isMicEnabled ? 'Mikrofonu kapat' : 'Mikrofonu aç'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <button
        onClick={onOpenParticipants}
        className="text-xs text-muted-foreground ml-1 hover:text-foreground transition-colors"
      >
        {participantCount} kişi
      </button>
    </div>
  );
};
