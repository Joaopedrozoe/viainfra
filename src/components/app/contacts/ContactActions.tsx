import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, X, Download, Upload } from "lucide-react";
import { PlanGate } from "@/components/ui/plan-gate";
import { PLAN_FEATURES } from "@/types/plans";

interface ContactActionsProps {
  selectedContacts: string[];
  onBulkMessage: () => void;
  onClearSelection: () => void;
}

export const ContactActions = ({
  selectedContacts,
  onBulkMessage,
  onClearSelection
}: ContactActionsProps) => {
  const hasSelection = selectedContacts.length > 0;

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Ações</h3>
      
      {/* Bulk Actions */}
      {hasSelection && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              {selectedContacts.length} selecionado{selectedContacts.length !== 1 ? 's' : ''}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearSelection}
                className="h-auto p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <PlanGate feature={PLAN_FEATURES.BULK_MESSAGING}>
              <Button 
                onClick={onBulkMessage}
                className="w-full"
                size="sm"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Enviar Mensagem
              </Button>
            </PlanGate>
            
            <Button 
              variant="outline" 
              className="w-full"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Seleção
            </Button>
          </CardContent>
        </Card>
      )}

      {/* General Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Gerenciar Contatos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <PlanGate feature={PLAN_FEATURES.BULK_MESSAGING}>
            <Button 
              variant="outline" 
              className="w-full"
              size="sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar CSV
            </Button>
          </PlanGate>
          
          <Button 
            variant="outline" 
            className="w-full"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Todos
          </Button>
        </CardContent>
      </Card>

      {/* Quick Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filtros Rápidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm"
            size="sm"
          >
            VIP ({/* Add VIP count here */}3)
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm"
            size="sm"
          >
            Sem E-mail ({/* Add count here */}2)
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm"
            size="sm"
          >
            Tarefas Pendentes ({/* Add count here */}5)
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm"
            size="sm"
          >
            Inativos ({/* Add count here */}1)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};