-- Fix profiles table RLS policies to require authentication
-- Drop existing SELECT policies that might allow unauthenticated access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles from their company" ON public.profiles;

-- Create new policies with explicit authentication checks
CREATE POLICY "Authenticated users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view profiles from their company"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND company_id = get_user_company_id(auth.uid())
  AND user_id != auth.uid() -- Don't duplicate with own profile policy
);

-- Fix messages table public access
-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Allow public web widget access to messages" ON public.messages;

-- Create a more restrictive policy that still allows widget functionality
-- but prevents arbitrary conversation access
CREATE POLICY "Public can view web messages with valid conversation"
ON public.messages
FOR SELECT
TO anon
USING (
  conversation_id IN (
    SELECT id 
    FROM conversations 
    WHERE channel = 'web' 
    AND status = 'open'
    AND updated_at > (now() - interval '24 hours') -- Only recent conversations
  )
);