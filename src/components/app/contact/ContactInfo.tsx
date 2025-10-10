
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ContactInfoProps {
  contactId: string | undefined;
}

export const ContactInfo = ({ contactId }: ContactInfoProps) => {
  const [contactData, setContactData] = useState<{
    name: string;
    phone?: string;
    email?: string;
  } | null>(null);

  useEffect(() => {
    const loadContactData = async () => {
      if (!contactId) return;

      try {
        // Buscar conversa para obter contact_id
        const { data: conversation } = await supabase
          .from('conversations')
          .select(`
            contact_id,
            contacts (
              name,
              phone,
              email
            )
          `)
          .eq('id', contactId)
          .single();

        if (conversation?.contacts) {
          setContactData({
            name: conversation.contacts.name,
            phone: conversation.contacts.phone,
            email: conversation.contacts.email
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dados do contato:', error);
      }
    };

    loadContactData();
  }, [contactId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações do Contato</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Nome</label>
            <p className="mt-1">{contactData?.name || "Carregando..."}</p>
          </div>
          {contactData?.phone && (
            <div>
              <label className="text-sm font-medium text-gray-500">Telefone</label>
              <p className="mt-1">{contactData.phone}</p>
            </div>
          )}
          {contactData?.email && (
            <div>
              <label className="text-sm font-medium text-gray-500">E-mail</label>
              <p className="mt-1">{contactData.email}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
