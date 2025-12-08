import { Users, Mic, MicOff, Crown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ParticipantsDialogProps {
  participants: Map<string, { name: string; isSpeaking: boolean }>;
  isOwner: boolean;
  currentUsername: string;
  isMicEnabled: boolean;
  isConnected: boolean;
}

export const ParticipantsDialog = ({
  participants,
  isOwner,
  currentUsername,
  isMicEnabled,
  isConnected,
}: ParticipantsDialogProps) => {
  const participantList = Array.from(participants.entries());
  // Total count: other participants + current user (if connected)
  const totalCount = isConnected ? participantList.length + 1 : participantList.length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground px-2"
        >
          <Users className="w-4 h-4" />
          <span className="text-xs">{totalCount}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Odadaki Kullanıcılar ({totalCount})
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {/* Current user - only show if connected */}
          {isConnected && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10">
              <div className="flex items-center gap-2">
                {isOwner && <Crown className="w-4 h-4 text-yellow-500" />}
                <span className="text-sm font-medium">{currentUsername} (Sen)</span>
              </div>
              {isMicEnabled ? (
                <Mic className="w-4 h-4 text-primary" />
              ) : (
                <MicOff className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          )}

          {/* Other participants */}
          {participantList.map(([id, participant]) => (
            <div
              key={id}
              className={cn(
                'flex items-center justify-between p-2 rounded-lg bg-secondary/50',
                participant.isSpeaking && 'ring-2 ring-primary'
              )}
            >
              <span className="text-sm">{participant.name}</span>
              {participant.isSpeaking ? (
                <Mic className="w-4 h-4 text-primary animate-pulse" />
              ) : (
                <MicOff className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          ))}

          {totalCount === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Henüz bağlanan yok
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
