import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ImagePlus, Loader2, Eye, EyeOff } from 'lucide-react';
import neofilmLogo from '@/assets/neofilm-logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const emailSchema = z.string().email('Geçerli bir e-posta adresi girin');
const passwordSchema = z.string().min(6, 'Şifre en az 6 karakter olmalı');

const Auth = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<'auth' | 'profile'>('auth');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Auth fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Profile fields
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Hata',
          description: err.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }
    
    setLoading(true);
    
    if (isLogin) {
      const { error } = await signIn(email, password);
      
      if (error) {
        let message = 'Giriş yapılırken bir hata oluştu';
        if (error.message.includes('Invalid login credentials')) {
          message = 'E-posta veya şifre hatalı';
        }
        toast({
          title: 'Hata',
          description: message,
          variant: 'destructive',
        });
      } else {
        navigate('/');
      }
    } else {
      // Move to profile step
      setStep('profile');
    }
    
    setLoading(false);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        title: 'Hata',
        description: 'Kullanıcı adı giriniz',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    
    let avatarUrl: string | undefined;
    
    // Upload avatar if selected
    if (avatar) {
      const fileExt = avatar.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
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
    
    const { error } = await signUp(email, password, username, avatarUrl);
    
    if (error) {
      let message = 'Kayıt olurken bir hata oluştu';
      if (error.message.includes('already registered')) {
        message = 'Bu e-posta adresi zaten kayıtlı';
      }
      toast({
        title: 'Hata',
        description: message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Başarılı',
        description: 'Kayıt başarılı! Giriş yapılıyor...',
      });
      navigate('/');
    }
    
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen cinema-gradient flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen cinema-gradient flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Header */}
        <div className="text-center mb-1">
          <img src={neofilmLogo} alt="NEO FİLM" className="w-72 h-72 mx-auto -mb-20 -mt-44 object-contain" />
          <h1 className="text-2xl font-bold glow-text">
            {step === 'auth' 
              ? (isLogin ? 'Giriş Yap' : 'Kayıt Ol')
              : 'Profil Oluştur'
            }
          </h1>
          <p className="text-muted-foreground mt-1 text-sm mb-2">
            {step === 'auth'
              ? (isLogin ? 'Hesabınıza giriş yapın' : 'Yeni bir hesap oluşturun')
              : 'Kullanıcı bilgilerinizi girin'
            }
          </p>
        </div>

        {step === 'auth' ? (
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta"
                className="pl-10 h-12 bg-input border-border/50"
                required
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifre"
                className="pl-10 pr-10 h-12 bg-input border-border/50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                'Giriş Yap'
              ) : (
                'Devam Et'
              )}
            </Button>
            
            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setStep('auth');
                }}
                className="text-primary hover:underline"
              >
                {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {/* Avatar Upload */}
            <div className="flex justify-center">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-full bg-secondary/50 border-2 border-dashed border-border/50 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <ImagePlus className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarSelect}
                accept="image/*"
                className="hidden"
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Profil fotoğrafı ekle (opsiyonel)
            </p>
            
            {/* Username Input */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı Adı"
                className="pl-10 h-12 bg-input border-border/50"
                required
                maxLength={30}
              />
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Tamamla'
              )}
            </Button>
            
            <button
              type="button"
              onClick={() => setStep('auth')}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Geri Dön
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
