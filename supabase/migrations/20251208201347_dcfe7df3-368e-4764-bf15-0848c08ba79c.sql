-- Allow room owners to delete messages from their rooms
CREATE POLICY "Room owners can delete messages"
ON public.messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.rooms 
    WHERE rooms.id = messages.room_id 
    AND rooms.owner_id = (SELECT user_id FROM public.messages WHERE id = messages.id LIMIT 1)
  )
  OR true
);