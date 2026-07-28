CREATE INDEX IF NOT EXISTS idx_messages_external_id
  ON public.messages ((metadata->>'external_id'))
  WHERE metadata->>'external_id' IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_message_id
  ON public.messages ((metadata->>'messageId'))
  WHERE metadata->>'messageId' IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at
  ON public.messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contacts_company_phone
  ON public.contacts (company_id, phone);

CREATE INDEX IF NOT EXISTS idx_conversations_company_contact
  ON public.conversations (company_id, contact_id);