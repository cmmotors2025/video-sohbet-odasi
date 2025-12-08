import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
}

interface ChatBoxProps {
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  loading?: boolean;
}

export const ChatBox = ({ 
  messages, 
  currentUserId, 
  onSendMessage,
  loading 
}: ChatBoxProps) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-card/50 rounded-lg border border-border/30">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-border/30">
        <h3 className="font-medium text-sm text-foreground/90">Sohbet</h3>
      </div>

      {/* Messages Container */}
      <div 
        ref={containerRef}
        className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 scrollbar-thin"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">Yükleniyor...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">Henüz mesaj yok</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.user_id === currentUserId;
            const showUsername = index === 0 || 
              messages[index - 1].user_id !== message.user_id;

            return (
              <div
                key={message.id}
                className={cn(
                  'flex flex-col animate-fade-in',
                  isOwn ? 'items-end' : 'items-start'
                )}
              >
                {showUsername && !isOwn && (
                  <span className="text-xs text-muted-foreground mb-1 ml-2">
                    {message.username}
                  </span>
                )}
                <div
                  className={cn(
                    'max-w-[80%] px-3 py-2 rounded-2xl',
                    isOwn 
                      ? 'bg-chat-own text-foreground rounded-tr-sm' 
                      : 'bg-chat-bubble text-foreground rounded-tl-sm'
                  )}
                >
                  <p className="text-sm break-words">{message.content}</p>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 mx-2">
                  {formatTime(message.created_at)}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border/30">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Mesaj yazın..."
            className="flex-1 bg-input border-border/50 text-sm"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!input.trim()}
            className="bg-primary hover:bg-primary/90 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
