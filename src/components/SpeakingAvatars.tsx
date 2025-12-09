import { RoomParticipant } from '@/hooks/useRoomPresence';

interface SpeakingAvatarsProps {
  participants: Map<string, RoomParticipant>;
  currentUserMicEnabled: boolean;
  currentUserAvatar: string | null;
  currentUserUsername: string;
  onClick: () => void;
}

export const SpeakingAvatars = ({
  participants,
  currentUserMicEnabled,
  currentUserAvatar,
  currentUserUsername,
  onClick,
}: SpeakingAvatarsProps) => {
  // Get participants with microphone enabled (isSpeaking means mic is on in our context)
  const speakingParticipants = Array.from(participants.values()).filter(p => p.isSpeaking);
  
  // Collect all avatars to show
  const avatarsToShow: { avatar: string | null; username: string; isCurrentUser: boolean }[] = [];
  
  if (currentUserMicEnabled) {
    avatarsToShow.push({
      avatar: currentUserAvatar,
      username: currentUserUsername,
      isCurrentUser: true,
    });
  }
  
  speakingParticipants.forEach(p => {
    avatarsToShow.push({
      avatar: p.avatar_url,
      username: p.username,
      isCurrentUser: false,
    });
  });

  const noOneSpeaking = avatarsToShow.length === 0;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/30 hover:bg-secondary/70 transition-colors"
    >
      {noOneSpeaking ? (
        <span className="text-xs text-muted-foreground">Sessiz</span>
      ) : (
        <div className="flex -space-x-2">
          {avatarsToShow.slice(0, 5).map((item, index) => (
            <img
              key={`${item.username}-${index}`}
              src={item.avatar || '/placeholder.svg'}
              alt={item.username}
              className="w-7 h-7 rounded-full border-2 border-primary ring-2 ring-primary/30 object-cover"
            />
          ))}
          {avatarsToShow.length > 5 && (
            <div className="w-7 h-7 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center">
              <span className="text-xs text-primary font-medium">+{avatarsToShow.length - 5}</span>
            </div>
          )}
        </div>
      )}
    </button>
  );
};
