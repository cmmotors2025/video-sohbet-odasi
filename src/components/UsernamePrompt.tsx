import { useState, useRef } from 'react';
import { User, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setUsername, getUsername, setAvatar, getAvatar, getUserId } from '@/lib/user';
import { supabase } from '@/integrations/supabase/client';

interface UsernamePromptProps {
  onComplete: () => void;
}

export const UsernamePrompt = ({ onComplete }: UsernamePromptProps) => {
  const [name, setName] = useState(getUsername());
  const [avatarPreview, setAvatarPreview] = useState(getAvatar());
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Fotoğraf 5MB\'dan küçük olmalı');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return avatarPreview || null;

    const userId = getUserId();
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;

    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarFile);

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Lütfen bir kullanıcı adı girin');
      return;
    }
    
    if (!avatarPreview) {
      setError('Lütfen bir profil fotoğrafı seçin');
      return;
    }

    if (name.trim().length < 2) {
      setError('Kullanıcı adı en az 2 karakter olmalı');
      return;
    }

    setUploading(true);
    
    try {
      const avatarUrl = await uploadAvatar();
      if (avatarUrl) {
        setAvatar(avatarUrl);
      }
      setUsername(name.trim());
      onComplete();
    } catch (err) {
      console.error('Error:', err);
      setError('Bir hata oluştu, tekrar deneyin');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-sm glass-surface rounded-2xl p-6 animate-scale-in">
        <div className="flex flex-col items-center text-center mb-6">
          <h2 className="text-xl font-semibold">Hoş Geldiniz!</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Odaya katılmak için profilinizi oluşturun
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Selection */}
          <div className="flex justify-center">
            <div 
              className="relative cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-primary/30 group-hover:border-primary transition-colors">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-primary" />
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <Camera className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
            />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Profil fotoğrafı seçmek için tıklayın
          </p>

          {/* Username Input */}
          <div>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Kullanıcı adınız"
              className="bg-input border-border/50 text-center"
            />
            {error && (
              <p className="text-destructive text-xs mt-2 text-center">{error}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading ? 'Yükleniyor...' : 'Devam Et'}
          </Button>
        </form>
      </div>
    </div>
  );
};
