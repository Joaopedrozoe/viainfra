
DROP POLICY IF EXISTS "Service role can delete profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload profile pictures" ON storage.objects;
CREATE POLICY "Signed-in users upload profile pictures" ON storage.objects FOR INSERT TO authenticated, service_role
  WITH CHECK (bucket_id = 'profile-pictures');
CREATE POLICY "Signed-in users update profile pictures" ON storage.objects FOR UPDATE TO authenticated, service_role
  USING (bucket_id = 'profile-pictures') WITH CHECK (bucket_id = 'profile-pictures');
CREATE POLICY "Signed-in users delete profile pictures" ON storage.objects FOR DELETE TO authenticated, service_role
  USING (bucket_id = 'profile-pictures');

DROP POLICY IF EXISTS "Authenticated users can delete chat attachments" ON storage.objects;
CREATE POLICY "Owners delete chat attachments" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chat-attachments' AND owner_id = (select auth.uid()::text));
