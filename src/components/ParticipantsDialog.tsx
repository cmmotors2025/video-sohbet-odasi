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
}

export const ParticipantsDialog = ({
  participants,
  isOwner,
  currentUsername,
}: ParticipantsDialogProps) => {
  const participantList = Array.from(participants.entries());
  const totalCount = participantList.length + 1; // +1 for current user

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground px-2"
        >
          <Users className="w-4 h-4" />
          <span className="text-xs">{isOwner ? 'Oda Sahibi' : 'İzleyici'}</span>
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
          {/* Current user */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10">
            <div className="flex items-center gap-2">
              {isOwner && <Crown className="w-4 h-4 text-yellow-500" />}
              <span className="text-sm font-medium">{currentUsername} (Sen)</span>
            </div>
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
              <span className="text-sm">{participant.name}</span>
              {participant.isSpeaking ? (
                <Mic className="w-4 h-4 text-primary animate-pulse" />
              ) : (
                <MicOff className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          ))}

          {participantList.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Başka kimse yok
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
