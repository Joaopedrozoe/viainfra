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
  GitBranch
} from "lucide-react";
import { ChatBotPreview } from "@/components/app/chat/ChatBotPreview";
import { BotVersionControl } from "@/components/app/bots/BotVersionControl";
import { BotFlowBuilder } from "@/components/app/bots/BotFlowBuilder";

export interface BotVersion {
  id: string;
  name: string;
  version: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  flows: {
    nodes: Node[];
    edges: Edge[];
  };
}

const BotBuilder = () => {
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>("v1");
  const [showPreview, setShowPreview] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialBotState, setInitialBotState] = useState<BotVersion | null>(null);
  
  // Bot versions state - FLUXO-VIAINFRA já criado
  const [botVersions, setBotVersions] = useState<BotVersion[]>([
    {
      id: "fluxo-viainfra",
      name: "FLUXO-VIAINFRA", 
      version: "v1",
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      flows: {
        nodes: [], // Começa vazio, será carregado com o fluxo padrão no BotFlowBuilder
        edges: []
      }
    }
  ]);

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

  // Detectar mudanças no bot atual - apenas quando há mudanças reais
  useEffect(() => {
    if (currentBot && initialBotState && currentBot.id === initialBotState.id && currentBot.version === initialBotState.version) {
      // Comparar apenas os fluxos de forma mais precisa
      const currentFlowString = JSON.stringify({
        nodes: currentBot.flows.nodes,
        edges: currentBot.flows.edges
      });
      const initialFlowString = JSON.stringify({
        nodes: initialBotState.flows.nodes,
        edges: initialBotState.flows.edges
      });
      
      const hasChanges = currentFlowString !== initialFlowString;
      setHasUnsavedChanges(hasChanges);
    } else if (!currentBot || !initialBotState) {
      setHasUnsavedChanges(false);
    }
  }, [currentBot?.flows, initialBotState]);

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
        // Salvar estado inicial para detectar mudanças - criar uma cópia profunda
        const initialState = {
          ...bot,
          flows: {
            nodes: bot.flows.nodes.map(node => ({ ...node, data: { ...node.data } })),
            edges: bot.flows.edges.map(edge => ({ ...edge }))
          }
        };
        setInitialBotState(initialState);
        setHasUnsavedChanges(false);
      }
    } else {
      // Limpar estado ao voltar
      setInitialBotState(null);
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
    if (initialBotState) {
      // Restaurar estado inicial
      setBotVersions(prev => prev.map(bot => 
        bot.id === initialBotState.id && bot.version === initialBotState.version
          ? initialBotState
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
        key={showPreview ? `preview-${Date.now()}` : 'preview-closed'}
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