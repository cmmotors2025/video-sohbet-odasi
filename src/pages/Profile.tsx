import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ImagePlus, LogOut, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, signOut, updateProfile, refreshProfile } = useAuth();
  
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setAvatarPreview(profile.avatar_url);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      const usernameChanged = username !== profile.username;
      const avatarChanged = avatar !== null;
      setHasChanges(usernameChanged || avatarChanged);
    }
  }, [username, avatar, profile]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      toast({
        title: 'Hata',
        description: 'Kullanıcı adı boş olamaz',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    
    let avatarUrl = profile?.avatar_url;
    
    // Upload new avatar if selected
    if (avatar) {
      const fileExt = avatar.name.split('.').pop();
      const fileName = `${user?.id}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatar);
      
      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(uploadData.path);
        
        avatarUrl = publicUrlData.publicUrl;
      }
    }
    
    const { error } = await updateProfile({
      username: username.trim(),
      avatar_url: avatarUrl,
    });
    
    if (error) {
      toast({
        title: 'Hata',
        description: 'Profil güncellenirken bir hata oluştu',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Başarılı',
        description: 'Profil güncellendi',
      });
      setAvatar(null);
      await refreshProfile();
    }
    
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen cinema-gradient flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen cinema-gradient flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Profil</h1>
      </div>

      <div className="flex-1 flex flex-col items-center max-w-sm mx-auto w-full animate-fade-in">
        {/* Avatar */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-28 h-28 rounded-full bg-secondary/50 border-2 border-dashed border-border/50 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden mb-6"
        >
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <ImagePlus className="w-10 h-10 text-muted-foreground" />
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarSelect}
          accept="image/*"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-sm text-primary hover:underline mb-8"
        >
          Fotoğrafı Değiştir
        </button>

        {/* Username */}
        <div className="w-full space-y-2 mb-8">
          <label className="text-sm text-muted-foreground">Kullanıcı Adı</label>
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-12 bg-input border-border/50"
            maxLength={30}
          />
        </div>

        {/* Email (read-only) */}
        <div className="w-full space-y-2 mb-8">
          <label className="text-sm text-muted-foreground">E-posta</label>
          <Input
            type="email"
            value={user?.email || ''}
            className="h-12 bg-input border-border/50 opacity-50"
            disabled
          />
        </div>

        {/* Save Button */}
        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90 mb-4"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Kaydet
              </>
            )}
          </Button>
        )}

        {/* Sign Out Button */}
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="w-full h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Çıkış Yap
        </Button>
      </div>
    </div>
  );
};

export default Profile;
