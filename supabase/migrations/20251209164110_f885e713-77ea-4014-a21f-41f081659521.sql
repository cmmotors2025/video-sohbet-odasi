-- Admin odaları silebilir
CREATE POLICY "Admins can delete rooms"
ON public.rooms
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin mesajları silebilir
CREATE POLICY "Admins can delete messages"
ON public.messages
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));