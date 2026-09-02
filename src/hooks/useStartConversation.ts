import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StartConversationInput {
  companyId: string;
  name: string;
  phone: string;
  email?: string;
}

export interface StartedConversation {
  conversationId: string;
  contactId: string;
  contactName: string;
  normalizedPhone: string;
  createdContact: boolean;
  createdConversation: boolean;
}

export const normalizeWhatsAppPhone = (value: string): string | null => {
  const digits = value.replace(/\D/g, "");
  const normalized = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;

  return normalized.length >= 12 && normalized.length <= 15 ? normalized : null;
};

const activeConversationStatuses = ["open", "pending"] as const;

export const startConversation = async ({
  companyId,
  name,
  phone,
  email,
}: StartConversationInput): Promise<StartedConversation> => {
  const trimmedName = name.trim();
  const normalizedPhone = normalizeWhatsAppPhone(phone);

  if (!companyId) throw new Error("Empresa ativa não encontrada.");
  if (!trimmedName) throw new Error("Informe o nome do contato.");
  if (!normalizedPhone) throw new Error("Informe um número de WhatsApp válido.");

  const { data: existingContacts, error: contactLookupError } = await supabase
    .from("contacts")
    .select("id, name, phone, email, metadata")
    .eq("company_id", companyId)
    .eq("phone", normalizedPhone)
    .limit(1);

  if (contactLookupError) throw contactLookupError;

  let contact = existingContacts?.[0];
  let createdContact = false;

  if (!contact) {
    const { data: created, error: contactInsertError } = await supabase
      .from("contacts")
      .insert({
        company_id: companyId,
        name: trimmedName,
        phone: normalizedPhone,
        email: email?.trim() || null,
        metadata: { source: "inbox_quick_start" },
      })
      .select("id, name, phone, email, metadata")
      .single();

    if (contactInsertError) {
      if (contactInsertError.code === "23505") {
        const { data: racedContact, error: racedLookupError } = await supabase
          .from("contacts")
          .select("id, name, phone, email, metadata")
          .eq("company_id", companyId)
          .eq("phone", normalizedPhone)
          .limit(1);
        if (racedLookupError || !racedContact?.[0]) throw contactInsertError;
        contact = racedContact[0];
      } else {
        throw contactInsertError;
      }
    } else if (created) {
      contact = created;
      createdContact = true;
    }
  }

  if (!contact) throw new Error("Não foi possível localizar o contato.");

  const { data: existingConversations, error: conversationLookupError } = await supabase
    .from("conversations")
    .select("id")
    .eq("company_id", companyId)
    .eq("contact_id", contact.id)
    .eq("channel", "whatsapp")
    .in("status", [...activeConversationStatuses])
    .order("updated_at", { ascending: false })
    .limit(1);

  if (conversationLookupError) throw conversationLookupError;

  const existingConversation = existingConversations?.[0];
  if (existingConversation) {
    return {
      conversationId: existingConversation.id,
      contactId: contact.id,
      contactName: contact.name || trimmedName,
      normalizedPhone,
      createdContact,
      createdConversation: false,
    };
  }

  const metadata = {
    remoteJid: `${normalizedPhone}@s.whatsapp.net`,
    contactPhone: normalizedPhone,
    contactName: contact.name || trimmedName,
    createdFrom: "inbox_quick_start",
  };

  const { data: createdConversation, error: conversationInsertError } = await supabase
    .from("conversations")
    .insert({
      company_id: companyId,
      contact_id: contact.id,
      channel: "whatsapp",
      status: "open",
      metadata,
    })
    .select("id")
    .single();

  if (conversationInsertError) throw conversationInsertError;
  if (!createdConversation) throw new Error("Não foi possível criar a conversa.");

  return {
    conversationId: createdConversation.id,
    contactId: contact.id,
    contactName: contact.name || trimmedName,
    normalizedPhone,
    createdContact,
    createdConversation: true,
  };
};

export const useStartConversation = (companyId?: string) => {
  const start = useCallback(
    (input: Omit<StartConversationInput, "companyId">) => {
      if (!companyId) return Promise.reject(new Error("Empresa ativa não encontrada."));
      return startConversation({ ...input, companyId });
    },
    [companyId],
  );

  return { startConversation: start };
};
