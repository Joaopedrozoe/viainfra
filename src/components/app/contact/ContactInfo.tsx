
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface ContactInfoProps {
  contactId: string | undefined;
}

export const ContactInfo = ({ contactId }: ContactInfoProps) => {
  const [contactData, setContactData] = useState<{
    name: string;
    email?: string;
  } | null>(null);

  useEffect(() => {
    // Simulação de uma tabela de correspondência entre conversas e contatos
    const contactMapping: Record<string, { name: string, email?: string }> = {
      "1": { name: "João Silva", email: "joao@example.com" },
      "2": { name: "Maria Souza", email: "maria@example.com" },
      "3": { name: "Pedro Santos", email: "pedro@example.com" },
      "4": { name: "Ana Costa", email: "ana@example.com" },
      "5": { name: "Carlos Oliveira", email: "carlos@example.com" }
    };
    
    if (contactId && contactMapping[contactId]) {
      setContactData(contactMapping[contactId]);
    }
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
          <div>
            <label className="text-sm font-medium text-gray-500">E-mail</label>
            <p className="mt-1">{contactData?.email || "Não informado"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
