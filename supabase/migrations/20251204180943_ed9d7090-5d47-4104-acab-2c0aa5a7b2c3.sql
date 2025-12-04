-- Add archived column to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON public.conversations(archived);

-- Comment for documentation
COMMENT ON COLUMN public.conversations.archived IS 'Whether this conversation is archived';