import { useState } from 'react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setUsername, getUsername } from '@/lib/user';

interface UsernamePromptProps {
  onComplete: () => void;
}

export const UsernamePrompt = ({ onComplete }: UsernamePromptProps) => {
  const [name, setName] = useState(getUsername());
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Lütfen bir kullanıcı adı girin');
      return;
    }
    
    if (name.trim().length < 2) {
      setError('Kullanıcı adı en az 2 karakter olmalı');
      return;
    }

    setUsername(name.trim());
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-sm glass-surface rounded-2xl p-6 animate-scale-in">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Hoş Geldiniz!</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Odaya katılmak için bir kullanıcı adı seçin
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Kullanıcı adınız"
              className="bg-input border-border/50 text-center"
              autoFocus
            />
            {error && (
              <p className="text-destructive text-xs mt-2 text-center">{error}</p>
            )}
          </div>
          <Button type="submit" className="w-full">
            Devam Et
          </Button>
        </form>
      </div>
    </div>
  );
};
