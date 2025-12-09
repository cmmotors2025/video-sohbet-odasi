-- Messages tablosuna avatar_url kolonu ekle
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS avatar_url text;

-- Avatarlar için storage bucket oluştur
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Avatar upload policy
CREATE POLICY "Anyone can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

-- Avatar view policy
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');