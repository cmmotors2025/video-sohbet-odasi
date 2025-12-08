-- Create rooms table
CREATE TABLE public.rooms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    owner_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create video_state table
CREATE TABLE public.video_state (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE UNIQUE,
    video_url TEXT,
    is_playing BOOLEAN NOT NULL DEFAULT false,
    playback_time REAL NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_state ENABLE ROW LEVEL SECURITY;

-- Public read/write policies for rooms (anonymous access)
CREATE POLICY "Anyone can create rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view rooms" ON public.rooms FOR SELECT USING (true);

-- Public read/write policies for messages
CREATE POLICY "Anyone can send messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view messages" ON public.messages FOR SELECT USING (true);

-- Public read/write policies for video_state
CREATE POLICY "Anyone can create video state" ON public.video_state FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view video state" ON public.video_state FOR SELECT USING (true);
CREATE POLICY "Anyone can update video state" ON public.video_state FOR UPDATE USING (true);

-- Enable realtime for messages and video_state
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_state;