-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('profile-pictures', 'profile-pictures', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Profile pictures are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete profile pictures" ON storage.objects;

-- Allow public access to profile pictures
CREATE POLICY "Profile pictures are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-pictures');

-- Allow anyone (service role) to upload profile pictures
CREATE POLICY "Service role can upload profile pictures"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'profile-pictures');

-- Allow anyone (service role) to update profile pictures
CREATE POLICY "Service role can update profile pictures"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'profile-pictures');

-- Allow anyone (service role) to delete profile pictures
CREATE POLICY "Service role can delete profile pictures"
ON storage.objects
FOR DELETE
USING (bucket_id = 'profile-pictures');