
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ContactInfo } from "@/components/app/contact/ContactInfo";
import { NotesList } from "@/components/app/contact/NotesList";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useDemoMode } from "@/hooks/useDemoMode";
import { getContactByConversationId } from "@/data/mockContacts";

const ContactDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDemoMode } = useDemoMode();
  const [activeTab, setActiveTab] = useState<"info" | "notes">("info");
  const [contactName, setContactName] = useState<string>("");
  
  // Get contact data from demo or real source
  useEffect(() => {
    if (isDemoMode) {
      const contact = getContactByConversationId(id || "");
      if (contact) {
        setContactName(contact.name);
      }
    } else {
      // Here you would fetch from real API/Supabase
      const contactData = getContactDataFromConversation(id || "");
      if (contactData) {
        setContactName(contactData.name);
      }
    }
  }, [id, isDemoMode]);

  // Function to simulate fetching contact data (for non-demo mode)
  const getContactDataFromConversation = (conversationId: string) => {
    const contactMapping: Record<string, { name: string, email?: string }> = {
      "1": { name: "João Silva", email: "joao@example.com" },
      "2": { name: "Maria Souza", email: "maria@example.com" },
      "3": { name: "Pedro Santos", email: "pedro@example.com" },
      "4": { name: "Ana Costa", email: "ana@example.com" },
      "5": { name: "Carlos Oliveira", email: "carlos@example.com" }
    };
    
    return contactMapping[conversationId];
  };

  const handleClose = useCallback(() => {
    // Navigate back to inbox with the conversation selected and explicitly set to show chat
    navigate("/inbox", { 
      state: { 
        selectedConversation: id, 
        showChat: true 
      } 
    });
  }, [id, navigate]);

  const handleTabChange = useCallback((tab: "info" | "notes") => {
    setActiveTab(tab);
  }, []);

  return (
    <div className="h-full">
      <main className="h-full overflow-auto">
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col bg-gray-50">
          <div className="bg-white border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClose}
                      className="mr-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div>
                      <h1 className="text-2xl font-semibold text-gray-900">
                        {contactName ? `Detalhes: ${contactName}` : "Detalhes do Contato"}
                      </h1>
                      {isDemoMode && (
                        <Badge variant="secondary" className="mt-1">
                          Modo Demonstração
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => handleTabChange("info")}
                      className={`${
                        activeTab === "info"
                          ? "border-bonina text-bonina"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      Informações
                    </button>
                    <button
                      onClick={() => handleTabChange("notes")}
                      className={`${
                        activeTab === "notes"
                          ? "border-bonina text-bonina"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      Notas e Tarefas
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
            {activeTab === "info" ? (
              <ContactInfo contactId={id} />
            ) : (
              <NotesList contactId={id} />
            )}
          </div>
        </div>
        </div>
      </main>
    </div>
  );
};

export default ContactDetails;
