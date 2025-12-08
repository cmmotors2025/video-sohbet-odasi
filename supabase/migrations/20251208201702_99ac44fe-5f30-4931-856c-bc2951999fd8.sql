-- Enable realtime for messages table DELETE events
ALTER TABLE public.messages REPLICA IDENTITY FULL;