DROP POLICY IF EXISTS "Anyone can view chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Profile pictures are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Widget files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload widget files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Signed-in users delete profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Signed-in users update profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Signed-in users upload profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload profile pictures" ON storage.objects;

CREATE POLICY "Owners upload chat attachments" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-attachments' AND owner_id = (select auth.uid()::text));
CREATE POLICY "Owners upload widget files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'widget' AND owner_id = (select auth.uid()::text));
CREATE POLICY "Owners upload profile pictures" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-pictures' AND owner_id = (select auth.uid()::text));
CREATE POLICY "Owners read own files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('chat-attachments','widget','profile-pictures') AND owner_id = (select auth.uid()::text));
CREATE POLICY "Owners update profile pictures" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-pictures' AND owner_id = (select auth.uid()::text))
  WITH CHECK (bucket_id = 'profile-pictures' AND owner_id = (select auth.uid()::text));
CREATE POLICY "Owners delete profile pictures" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-pictures' AND owner_id = (select auth.uid()::text));