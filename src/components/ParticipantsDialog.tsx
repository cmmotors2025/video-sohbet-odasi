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
import { RoomParticipant } from '@/hooks/useRoomPresence';

interface ParticipantsDialogProps {
  participants: Map<string, RoomParticipant>;
  isOwner: boolean;
  currentUser: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  isMicEnabled: boolean;
  isConnected: boolean;
}

export const ParticipantsDialog = ({
  participants,
  isOwner,
  currentUser,
  isMicEnabled,
  isConnected,
}: ParticipantsDialogProps) => {
  const participantList = Array.from(participants.entries());
  const totalCount = participantList.length + 1; // Always include current user

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
          {/* Current user - always show */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10">
            <div className="flex items-center gap-2">
              <img
                src={currentUser.avatar_url || '/placeholder.svg'}
                alt={currentUser.username}
                className="w-8 h-8 rounded-full object-cover border-2 border-primary/30"
              />
              {isOwner && <Crown className="w-4 h-4 text-yellow-500" />}
              <span className="text-sm font-medium">{currentUser.username} (Sen)</span>
            </div>
            {isConnected && (
              isMicEnabled ? (
                <Mic className="w-4 h-4 text-primary" />
              ) : (
                <MicOff className="w-4 h-4 text-muted-foreground" />
              )
            )}
          </div>

          {/* Other participants */}
          {participantList.map(([id, participant]) => (
            <div
              key={id}
              className={cn(
                'flex items-center justify-between p-2 rounded-lg bg-secondary/50',
                participant.isSpeaking && 'ring-2 ring-primary'
              )}
            >
              <div className="flex items-center gap-2">
                <img
                  src={participant.avatar_url || '/placeholder.svg'}
                  alt={participant.username}
                  className="w-8 h-8 rounded-full object-cover border-2 border-secondary"
                />
                <span className="text-sm">{participant.username}</span>
              </div>
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
