import { Mic, MicOff, Loader2, PhoneOff } from 'lucide-react';
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
  participantCount: number;
  error: string | null;
  onToggleMic: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const VoiceControls = ({
  isConnected,
  isConnecting,
  isMicEnabled,
  participantCount,
  error,
  onToggleMic,
  onConnect,
  onDisconnect,
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

  // Hata durumu - tekrar dene butonu
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

  // Henüz bağlanmadı - otomatik bağlanmayı bekliyor
  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-secondary/50 border border-border/30">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">Bağlanıyor...</span>
      </div>
    );
  }

  // Bağlı durumu - mikrofon kontrolleri
  return (
    <div className="flex items-center gap-1">
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

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDisconnect}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <PhoneOff className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sesli sohbetten ayrıl</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {participantCount > 0 && (
        <span className="text-xs text-muted-foreground ml-1">
          {participantCount}
        </span>
      )}
    </div>
  );
};
