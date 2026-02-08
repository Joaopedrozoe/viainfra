import { useState, useCallback, useEffect } from "react";
import { 
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Play, 
  Save, 
  Upload, 
  Download, 
  Copy, 
  Trash2, 
  Plus,
  Settings,
  GitBranch,
  Loader2
} from "lucide-react";
import { ChatBotPreview } from "@/components/app/chat/ChatBotPreview";
import { BotVersionControl } from "@/components/app/bots/BotVersionControl";
import { BotFlowBuilder } from "@/components/app/bots/BotFlowBuilder";
import { BotVersion } from "@/types/bot";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BotBuilder = () => {
  const { company } = useAuth();
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>("v1");
  const [showPreview, setShowPreview] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalBotData, setOriginalBotData] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Bot versions state - carregado do banco de dados
  const [botVersions, setBotVersions] = useState<BotVersion[]>([]);

  // Buscar bots do banco de dados filtrados pela empresa ativa
  useEffect(() => {
    const fetchBots = async () => {
      if (!company?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('🤖 [BotBuilder] Fetching bots for company:', company.id, company.name);
        
        const { data: bots, error } = await supabase
          .from('bots')
          .select('*')
          .eq('company_id', company.id);

        if (error) {
          console.error('❌ [BotBuilder] Error fetching bots:', error);
          toast.error('Erro ao carregar bots');
          return;
        }

        console.log('🤖 [BotBuilder] Bots found:', bots?.length || 0, bots);

        if (bots && bots.length > 0) {
          const mappedBots: BotVersion[] = bots.map(bot => {
            const flowsData = bot.flows as unknown as { nodes: Node[]; edges: Edge[] } | null;
            return {
              id: bot.id,
              name: bot.name,
              version: bot.version,
              status: bot.status as 'draft' | 'published',
              createdAt: bot.created_at,
              updatedAt: bot.updated_at,
              flows: flowsData || { nodes: [], edges: [] }
            };
          });
          setBotVersions(mappedBots);
        } else {
          setBotVersions([]);
        }
      } catch (err) {
        console.error('❌ [BotBuilder] Exception fetching bots:', err);
        toast.error('Erro ao carregar bots');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBots();
  }, [company?.id]);

  // Get unique bots (by id)
  const availableBots = botVersions.reduce((acc, bot) => {
    if (!acc.find(b => b.id === bot.id)) {
      acc.push(bot);
    }
    return acc;
  }, [] as BotVersion[]);

  const currentBot = botVersions.find(bot => 
    bot.id === selectedBot && bot.version === selectedVersion
  );

  // Função chamada quando há mudanças reais no fluxo
  const handleFlowChange = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const handleCreateNewVersion = () => {
    if (!currentBot) return;
    
    const nextVersionNumber = botVersions
      .filter(bot => bot.id === selectedBot)
      .length + 1;
    
    const newVersion: BotVersion = {
      ...currentBot,
      version: `v${nextVersionNumber}`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setBotVersions(prev => [...prev, newVersion]);
    setSelectedVersion(newVersion.version);
  };

  const handlePublish = () => {
    if (!currentBot) return;
    
    setBotVersions(prev => prev.map(bot => 
      bot.id === selectedBot && bot.version === selectedVersion
        ? { ...bot, status: 'published', updatedAt: new Date().toISOString() }
        : bot
    ));
  };

  const handleUnpublish = () => {
    if (!currentBot) return;
    
    setBotVersions(prev => prev.map(bot => 
      bot.id === selectedBot && bot.version === selectedVersion
        ? { ...bot, status: 'draft', updatedAt: new Date().toISOString() }
        : bot
    ));
  };

  const handleBotSelect = (botId: string | null) => {
    if (botId) {
      const bot = botVersions.find(b => b.id === botId);
      if (bot) {
        // Salvar dados originais para restauração
        setOriginalBotData({
          nodes: JSON.parse(JSON.stringify(bot.flows.nodes)),
          edges: JSON.parse(JSON.stringify(bot.flows.edges))
        });
        setHasUnsavedChanges(false);
      }
    } else {
      // Limpar estado ao voltar
      setOriginalBotData(null);
      setHasUnsavedChanges(false);
    }
    setSelectedBot(botId);
  };

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      handleBotSelect(null);
    }
  };

  const handleSaveAndExit = () => {
    // As mudanças já estão salvas automaticamente no estado
    setShowUnsavedDialog(false);
    handleBotSelect(null);
  };

  const handleDiscardAndExit = () => {
    if (originalBotData && currentBot) {
      // Restaurar estado original
      setBotVersions(prev => prev.map(bot => 
        bot.id === currentBot.id && bot.version === currentBot.version
          ? {
              ...bot,
              flows: originalBotData
            }
          : bot
      ));
    }
    setShowUnsavedDialog(false);
    handleBotSelect(null);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Construtor de Bots</h1>
            <p className="text-muted-foreground">
              Crie e gerencie fluxos conversacionais inteligentes
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedBot && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Preview
                </Button>
                {currentBot?.status === 'draft' ? (
                  <Button
                    onClick={handlePublish}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Publicar
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={handleUnpublish}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Despublicar
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {!selectedBot ? (
          /* Lista de Bots */
          <div className="flex-1 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Seus Bots</h2>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Criar Novo Bot
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Carregando bots...</span>
              </div>
            ) : availableBots.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum bot encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {company?.name ? `Não há bots configurados para ${company.name}.` : 'Selecione uma empresa para ver os bots.'}
                </p>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Bot
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableBots.map((bot) => {
                  const versions = botVersions.filter(v => v.id === bot.id);
                  const publishedVersion = versions.find(v => v.status === 'published');
                  
                  return (
                    <Card 
                      key={bot.id}
                      className="p-6 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        const targetVersion = publishedVersion?.version || versions[0]?.version || 'v1';
                        setSelectedVersion(targetVersion);
                        
                        // Aguardar o setState e depois selecionar o bot
                        setTimeout(() => {
                          handleBotSelect(bot.id);
                        }, 0);
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">{bot.name}</h3>
                        <Badge variant={publishedVersion ? 'default' : 'secondary'}>
                          {publishedVersion ? 'Publicado' : 'Rascunho'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4">
                        {versions.length} versão{versions.length !== 1 ? 'ões' : ''}
                      </p>
                      
                      <div className="text-xs text-muted-foreground">
                        Atualizado: {new Date(bot.updatedAt).toLocaleDateString('pt-BR')}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Sidebar - Version Control */}
            <div className="w-80 border-r border-border bg-muted/50">
              <BotVersionControl
                botVersions={botVersions}
                selectedBot={selectedBot}
                selectedVersion={selectedVersion}
                onSelectBot={handleBackClick}
                onSelectVersion={setSelectedVersion}
                onCreateNewVersion={handleCreateNewVersion}
                hasUnsavedChanges={hasUnsavedChanges}
              />
            </div>

            {/* Main Flow Builder */}
            <div className="flex-1">
              {currentBot ? (
                <BotFlowBuilder
                  bot={currentBot}
                  onUpdateBot={(updatedBot) => {
                    setBotVersions(prev => prev.map(bot => 
                      bot.id === updatedBot.id && bot.version === updatedBot.version
                        ? updatedBot
                        : bot
                    ));
                  }}
                  onFlowChange={handleFlowChange}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Selecione uma versão para começar</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Preview Modal */}
      <ChatBotPreview 
        isOpen={showPreview} 
        onClose={() => setShowPreview(false)}
        botData={currentBot}
        key={`preview-${selectedBot}-${selectedVersion}-${hasUnsavedChanges ? 'modified' : 'original'}`}
      />

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salvar modificações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem modificações não salvas no fluxo do bot. Deseja salvá-las antes de sair?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardAndExit}>
              Não, descartar mudanças
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndExit}>
              Sim, salvar mudanças
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BotBuilder;