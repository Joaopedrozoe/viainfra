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
  MarkerType,
  BackgroundVariant,
  Handle,
  Position
} from '@xyflow/react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Users, 
  Settings, 
  Play,
  Save,
  Plus,
  X,
  GitBranch,
  HelpCircle,
  Zap,
  Square,
  Trash2
} from "lucide-react";
import { BotVersion } from "@/pages/app/BotBuilder";
import { useDepartments } from "@/contexts/DepartmentsContext";

interface BotFlowBuilderProps {
  bot: BotVersion;
  onUpdateBot: (bot: BotVersion) => void;
  onFlowChange?: () => void;
}

// Primeiro, definir os componentes de nós

function StartNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-green-100 border-2 border-green-400">
      <Handle type="source" position={Position.Bottom} className="w-16 !bg-green-500" />
      <div className="flex">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-green-500">
          <Play className="w-4 h-4 text-white" />
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold">{data.label}</div>
          <div className="text-xs text-gray-500">{data.message}</div>
        </div>
      </div>
    </div>
  );
}

function MessageNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-blue-100 border-2 border-blue-400">
      <Handle type="target" position={Position.Top} className="w-16 !bg-blue-500" />
      <Handle type="source" position={Position.Bottom} className="w-16 !bg-blue-500" />
      <div className="flex">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-blue-500">
          <MessageSquare className="w-4 h-4 text-white" />
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold">{data.label}</div>
          <div className="text-xs text-gray-500">{data.message}</div>
        </div>
      </div>
    </div>
  );
}

function QuestionNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-yellow-100 border-2 border-yellow-400 min-w-[200px]">
      <Handle type="target" position={Position.Top} className="w-16 !bg-yellow-500" />
      <Handle type="source" position={Position.Bottom} className="w-16 !bg-yellow-500" />
      <div className="flex">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-yellow-500">
          <HelpCircle className="w-4 h-4 text-white" />
        </div>
        <div className="ml-2 flex-1">
          <div className="text-lg font-bold">{data.label}</div>
          <div className="text-xs text-gray-500 mb-2">{data.question}</div>
          {data.options && (
            <div className="space-y-1">
              {data.options.map((option: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs mr-1">
                  {option}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConditionNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-purple-100 border-2 border-purple-400">
      <Handle type="target" position={Position.Top} className="w-16 !bg-purple-500" />
      <Handle type="source" position={Position.Bottom} className="w-16 !bg-purple-500" />
      <div className="flex">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-purple-500">
          <GitBranch className="w-4 h-4 text-white" />
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold">{data.label}</div>
          <div className="text-xs text-gray-500">{data.condition}</div>
        </div>
      </div>
    </div>
  );
}

function ActionNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-orange-100 border-2 border-orange-400 min-w-[250px]">
      <Handle type="target" position={Position.Top} className="w-16 !bg-orange-500" />
      <Handle type="source" position={Position.Bottom} className="w-16 !bg-orange-500" />
      <div className="flex">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-orange-500">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div className="ml-2 flex-1">
          <div className="text-lg font-bold">{data.label}</div>
          <div className="text-xs text-gray-500 mb-2">{data.action}</div>
          {data.fields && (
            <div className="space-y-1">
              {data.fields.slice(0, 3).map((field: any, index: number) => (
                <div key={index} className="text-xs text-gray-600">
                  • {field.key}
                </div>
              ))}
              {data.fields.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{data.fields.length - 3} mais campos
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EndNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-red-100 border-2 border-red-400">
      <Handle type="target" position={Position.Top} className="w-16 !bg-red-500" />
      <div className="flex">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-red-500">
          <Square className="w-4 h-4 text-white" />
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold">{data.label}</div>
          <div className="text-xs text-gray-500">{data.message}</div>
        </div>
      </div>
    </div>
  );
}

// Tipos de nós customizados
const nodeTypes = {
  start: StartNode,
  message: MessageNode,
  question: QuestionNode,
  condition: ConditionNode,
  action: ActionNode,
  end: EndNode
};

const getInitialNodes = (): Node[] => [
  {
    id: 'start-1',
    type: 'start',
    position: { x: 400, y: 0 },
    data: { 
      label: 'Início',
      message: '👋 Olá! Bem-vindo à Viainfra!\n\nComo posso ajudar você hoje?'
    }
  },
  {
    id: 'menu-1', 
    type: 'question',
    position: { x: 400, y: 120 },
    data: {
      label: 'Menu Principal',
      question: 'Escolha uma opção:',
      options: ['1️⃣ Abrir Chamado', '2️⃣ Falar com Atendente', '3️⃣ Consultar Chamado', '4️⃣ FAQ / Dúvidas']
    }
  },
  {
    id: 'chamado-inicio',
    type: 'action',
    position: { x: 100, y: 280 },
    data: {
      label: 'Buscar Dados Chamado',
      actionType: 'api',
      action: 'Buscar último chamado e placas da API Google Sheets'
    }
  },
  {
    id: 'chamado-placa',
    type: 'question',
    position: { x: 100, y: 400 },
    data: {
      label: 'Selecionar Placa',
      question: '📋 Selecione uma placa:',
      options: ['Lista dinâmica de placas da API']
    }
  },
  {
    id: 'chamado-corretiva',
    type: 'question',
    position: { x: 100, y: 520 },
    data: {
      label: 'Tipo de Manutenção',
      question: '🔧 É uma manutenção corretiva?',
      options: ['Sim', 'Não']
    }
  },
  {
    id: 'chamado-local',
    type: 'question',
    position: { x: 100, y: 640 },
    data: {
      label: 'Local do Atendimento',
      question: '📍 Qual o local do atendimento?',
      options: ['Canteiro', 'Oficina']
    }
  },
  {
    id: 'chamado-agendamento',
    type: 'action',
    position: { x: 100, y: 760 },
    data: {
      label: 'Data e Hora',
      actionType: 'input',
      action: '📅 Informe a data e hora do agendamento (ex: 25/12/2024 14:30)'
    }
  },
  {
    id: 'chamado-descricao',
    type: 'action',
    position: { x: 100, y: 880 },
    data: {
      label: 'Descrição',
      actionType: 'input',
      action: '📝 Descreva o problema/serviço necessário'
    }
  },
  {
    id: 'chamado-criar',
    type: 'action',
    position: { x: 100, y: 1000 },
    data: {
      label: 'Criar Chamado',
      actionType: 'api',
      action: 'Enviar dados para Google Sheets e salvar no Supabase'
    }
  },
  {
    id: 'chamado-sucesso',
    type: 'message',
    position: { x: 100, y: 1120 },
    data: {
      label: 'Chamado Criado',
      message: '✅ Chamado criado com sucesso!\n\nDigite 0 para voltar ao menu principal.'
    }
  },
  {
    id: 'atendente-inicio',
    type: 'action',
    position: { x: 400, y: 280 },
    data: {
      label: 'Transferir Atendente',
      actionType: 'transfer',
      action: 'Atualizar status da conversa para "pending" e aguardar atendente'
    }
  },
  {
    id: 'atendente-aguardando',
    type: 'message',
    position: { x: 400, y: 400 },
    data: {
      label: 'Aguardando',
      message: '👤 Aguarde um momento...\n\nEstou transferindo você para um atendente.\n\nDigite 0 para voltar ao menu.'
    }
  },
  {
    id: 'consultar-chamado',
    type: 'action',
    position: { x: 700, y: 280 },
    data: {
      label: 'Consultar Chamado',
      actionType: 'input',
      action: '🔍 Informe o número do chamado'
    }
  },
  {
    id: 'faq',
    type: 'question',
    position: { x: 1000, y: 280 },
    data: {
      label: 'FAQ',
      question: '❓ Perguntas Frequentes:',
      options: ['Como abrir chamado?', 'Tempo de atendimento?', 'Acompanhar chamado?', 'Horário de funcionamento']
    }
  },
  {
    id: 'end-conversation',
    type: 'end',
    position: { x: 400, y: 1240 },
    data: {
      label: 'Fim',
      message: 'Conversa encerrada ou aguardando próxima ação'
    }
  }
];

const getInitialEdges = (): Edge[] => [
  // Menu principal
  {
    id: 'e-start-menu',
    source: 'start-1',
    target: 'menu-1',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  // Opção 1: Abrir Chamado
  {
    id: 'e-menu-chamado',
    source: 'menu-1',
    target: 'chamado-inicio',
    type: 'smoothstep',
    label: '1️⃣ Abrir Chamado',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'e-chamado-placa',
    source: 'chamado-inicio',
    target: 'chamado-placa',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'e-placa-corretiva',
    source: 'chamado-placa',
    target: 'chamado-corretiva',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'e-corretiva-local',
    source: 'chamado-corretiva',
    target: 'chamado-local',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'e-local-agendamento',
    source: 'chamado-local',
    target: 'chamado-agendamento',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'e-agendamento-descricao',
    source: 'chamado-agendamento',
    target: 'chamado-descricao',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'e-descricao-criar',
    source: 'chamado-descricao',
    target: 'chamado-criar',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'e-criar-sucesso',
    source: 'chamado-criar',
    target: 'chamado-sucesso',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'e-sucesso-end',
    source: 'chamado-sucesso',
    target: 'end-conversation',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  // Opção 2: Falar com Atendente
  {
    id: 'e-menu-atendente',
    source: 'menu-1',
    target: 'atendente-inicio',
    type: 'smoothstep',
    label: '2️⃣ Falar com Atendente',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'e-atendente-aguardando',
    source: 'atendente-inicio',
    target: 'atendente-aguardando',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'e-aguardando-end',
    source: 'atendente-aguardando',
    target: 'end-conversation',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  // Opção 3: Consultar Chamado
  {
    id: 'e-menu-consultar',
    source: 'menu-1',
    target: 'consultar-chamado',
    type: 'smoothstep',
    label: '3️⃣ Consultar',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'e-consultar-end',
    source: 'consultar-chamado',
    target: 'end-conversation',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  // Opção 4: FAQ
  {
    id: 'e-menu-faq',
    source: 'menu-1',
    target: 'faq',
    type: 'smoothstep',
    label: '4️⃣ FAQ',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'e-faq-end',
    source: 'faq',
    target: 'end-conversation',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  }
];

export function BotFlowBuilder({ bot, onUpdateBot, onFlowChange }: BotFlowBuilderProps) {
  const { departments } = useDepartments();
  
  // Inicializar com o fluxo do bot ou com o fluxo padrão se estiver vazio
  const initialNodes = bot.flows.nodes.length > 0 ? bot.flows.nodes : getInitialNodes();
  const initialEdges = bot.flows.edges.length > 0 ? bot.flows.edges : getInitialEdges();
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  // Função para atualizar label da edge quando opção é modificada
  const updateEdgeLabel = useCallback((nodeId: string, optionIndex: number, oldLabel: string, newLabel: string) => {
    setEdges((edges) => 
      edges.map((edge) => {
        // Buscar edge que sai do nó e corresponde à opção
        if (edge.source === nodeId) {
          // Se a edge já tem o label antigo, atualizar
          if (edge.label === oldLabel) {
            return { ...edge, label: newLabel };
          }
          // Se não tem label mas é a edge pelo índice
          const sourceEdges = edges.filter(e => e.source === nodeId);
          const edgeIndex = sourceEdges.indexOf(edge);
          if (edgeIndex === optionIndex && !edge.label) {
            return { ...edge, label: newLabel };
          }
        }
        return edge;
      })
    );
  }, [setEdges]);

  // Função para remover edge por label
  const removeEdgeByLabel = useCallback((nodeId: string, label: string) => {
    setEdges((edges) => 
      edges.filter((edge) => {
        if (edge.source === nodeId && edge.label === label) {
          return false;
        }
        return true;
      })
    );
  }, [setEdges]);

  const onConnect = useCallback((params: Connection) => {
    const newEdge = addEdge({
      ...params,
      markerEnd: { type: MarkerType.ArrowClosed },
      // Se o nó source é uma pergunta, adicionar label da opção correspondente
      label: (() => {
        const sourceNode = nodes.find(node => node.id === params.source);
        if (sourceNode?.type === 'question' && sourceNode.data?.options) {
          // Encontrar quantas edges já saem deste nó para determinar o índice
          const existingEdgesFromSource = edges.filter(edge => edge.source === params.source);
          const optionIndex = existingEdgesFromSource.length;
          return sourceNode.data.options[optionIndex] || '';
        }
        return '';
      })()
    }, edges);
    setEdges(newEdge);
    onFlowChange?.(); // Marcar como modificado
  }, [edges, nodes, setEdges, onFlowChange]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    if (bot.status === 'draft') {
      setSelectedNode(node);
      setEditingData({ ...node.data });
      setIsEditing(true);
    }
  }, [bot.status]);

  const onEdgeClick = useCallback((_: any, edge: Edge) => {
    if (bot.status === 'draft') {
      // Excluir edge ao clicar nela
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      onFlowChange?.(); // Marcar como modificado
    }
  }, [bot.status, setEdges, onFlowChange]);

  const addNode = useCallback((type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: Math.random() * 400 + 50, y: Math.random() * 400 + 50 },
      data: getDefaultNodeData(type)
    };
    setNodes((nds) => [...nds, newNode]);
    onFlowChange?.(); // Marcar como modificado
  }, [setNodes, onFlowChange]);

  const deleteNode = useCallback(() => {
    if (selectedNode) {
      // Remover o nó
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      // Remover todas as edges conectadas ao nó
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      // Limpar seleção
      setIsEditing(false);
      setSelectedNode(null);
      setEditingData(null);
      onFlowChange?.(); // Marcar como modificado
    }
  }, [selectedNode, setNodes, setEdges, onFlowChange]);

  const saveNodeEdit = useCallback(() => {
    if (selectedNode && editingData) {
      setNodes((nds) => 
        nds.map((node) => 
          node.id === selectedNode.id 
            ? { ...node, data: editingData }
            : node
        )
      );
      
      // Se é um nó de pergunta, atualizar labels das edges existentes
      if (selectedNode.type === 'question' && editingData.options) {
        const existingEdges = edges.filter(edge => edge.source === selectedNode.id);
        existingEdges.forEach((edge, index) => {
          if (editingData.options[index] && edge.label !== editingData.options[index]) {
            setEdges((edges) => 
              edges.map((e) => 
                e.id === edge.id 
                  ? { ...e, label: editingData.options[index] }
                  : e
              )
            );
          }
        });
      }
      
      setIsEditing(false);
      setSelectedNode(null);
      setEditingData(null);
      onFlowChange?.(); // Marcar como modificado
    }
  }, [selectedNode, editingData, setNodes, edges, setEdges, onFlowChange]);

  const cancelNodeEdit = useCallback(() => {
    setIsEditing(false);
    setSelectedNode(null);
    setEditingData(null);
  }, []);

  // Detectar tecla Delete para excluir nós
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' && selectedNode && bot.status === 'draft' && !isEditing) {
        deleteNode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, deleteNode, bot.status, isEditing]);

  // Salvar mudanças automaticamente apenas se não estiver editando
  useEffect(() => {
    if (!isEditing) {
      const updatedBot = {
        ...bot,
        flows: { nodes, edges },
        updatedAt: new Date().toISOString()
      };
      onUpdateBot(updatedBot);
    }
  }, [nodes, edges, isEditing]);

  const isEditable = bot.status === 'draft';

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      {isEditable && (
        <div className="border-b border-border p-3 bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium mr-4">Adicionar Nó:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addNode('start')}
              className="flex items-center gap-2 border-green-600 text-green-700 hover:bg-green-50"
            >
              <Play className="h-4 w-4" />
              Início
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addNode('message')}
              className="flex items-center gap-2 border-blue-600 text-blue-700 hover:bg-blue-50"
            >
              <MessageSquare className="h-4 w-4" />
              Mensagem
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addNode('question')}
              className="flex items-center gap-2 border-purple-600 text-purple-700 hover:bg-purple-50"
            >
              <HelpCircle className="h-4 w-4" />
              Pergunta
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addNode('condition')}
              className="flex items-center gap-2 border-yellow-600 text-yellow-700 hover:bg-yellow-50"
            >
              <GitBranch className="h-4 w-4" />
              Condição
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addNode('action')}
              className="flex items-center gap-2 border-orange-600 text-orange-700 hover:bg-orange-50"
            >
              <Settings className="h-4 w-4" />
              Ação
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addNode('end')}
              className="flex items-center gap-2 border-red-600 text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
              Fim
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Flow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={isEditable ? onNodesChange : undefined}
            onEdgesChange={isEditable ? onEdgesChange : undefined}
            onConnect={isEditable ? onConnect : undefined}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50"
            nodesDraggable={isEditable}
            nodesConnectable={isEditable}
            elementsSelectable={isEditable}
            deleteKeyCode={isEditable ? 'Delete' : null}
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
          
          {!isEditable && (
            <div className="absolute top-4 left-4 bg-amber-100 border border-amber-200 rounded px-3 py-2 text-sm text-amber-800">
              Versão publicada - somente leitura
            </div>
          )}

          {isEditable && (
            <div className="absolute top-4 left-4 bg-blue-100 border border-blue-200 rounded px-3 py-2 text-sm text-blue-800">
              💡 Dica: Clique em nós para editar, nas linhas para excluir, ou pressione Delete
            </div>
          )}
        </div>

        {/* Properties Panel */}
        {selectedNode && isEditing && (
          <div className="w-80 border-l border-border bg-background">
            <NodePropertiesPanel 
              node={selectedNode}
              editingData={editingData}
              onUpdateData={setEditingData}
              onSave={saveNodeEdit}
              onCancel={cancelNodeEdit}
              onDelete={deleteNode}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// As definições dos componentes já estão no início do arquivo

// Função para obter dados padrão de um nó
function getDefaultNodeData(type: string) {
  switch (type) {
    case 'start':
      return { label: 'Início', message: 'Bem-vindo!' };
    case 'message':
      return { label: 'Nova Mensagem', message: 'Digite sua mensagem aqui...' };
    case 'question':
      return { label: 'Nova Pergunta', question: 'Digite sua pergunta...', options: ['Opção 1', 'Opção 2'] };
    case 'condition':
      return { label: 'Nova Condição', condition: 'Condição...' };
    case 'action':
      return { 
        label: 'Processo de Chamado', 
        actionType: 'form',
        action: 'Coletar dados do chamado', 
        fields: [
          { key: 'PLACA', placeholder: 'Informe a placa do veículo', type: 'text', required: true },
          { key: 'CORRETIVA', placeholder: 'Sim ou Não', type: 'select', options: ['Sim', 'Não'], required: true },
          { key: 'CANTEIRO OU OFICINA', placeholder: 'Canteiro ou Oficina', type: 'select', options: ['Canteiro', 'Oficina'], required: true },
          { key: 'AGENDAMENTO', placeholder: 'Data e hora (ex: 25/08/2025 14:30)', type: 'text', required: true },
          { key: 'DESCRIÇÃO', placeholder: 'Descreva o problema ou necessidade', type: 'textarea', required: true }
        ] 
      };
    case 'end':
      return { label: 'Fim', message: 'Conversa encerrada!' };
    default:
      return { label: 'Novo Nó' };
  }
}

// Painel de Propriedades do Nó Melhorado
function NodePropertiesPanel({ 
  node, 
  editingData,
  onUpdateData,
  onSave,
  onCancel,
  onDelete
}: { 
  node: Node; 
  editingData: any;
  onUpdateData: (data: any) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const updateField = (field: string, value: any) => {
    onUpdateData({ ...editingData, [field]: value });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(editingData.options || [])];
    newOptions[index] = value;
    updateField('options', newOptions);
  };

  const addOption = () => {
    const newOptions = [...(editingData.options || []), 'Nova opção'];
    updateField('options', newOptions);
  };

  const removeOption = (index: number) => {
    const newOptions = (editingData.options || []).filter((_: any, i: number) => i !== index);
    updateField('options', newOptions);
  };

  return (
    <Card className="h-full m-4">
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Editar Nó</h3>
          <Badge variant="secondary">{node.type}</Badge>
        </div>
        
        <div className="flex-1 space-y-4 overflow-y-auto">
          <div>
            <Label htmlFor="node-label">Nome do Nó</Label>
            <Input
              id="node-label"
              value={editingData?.label || ''}
              onChange={(e) => updateField('label', e.target.value)}
            />
          </div>

          {(node.type === 'message' || node.type === 'start') && (
            <div>
              <Label htmlFor="node-message">Mensagem</Label>
              <Textarea
                id="node-message"
                value={editingData?.message || ''}
                onChange={(e) => updateField('message', e.target.value)}
                rows={4}
              />
            </div>
          )}

          {node.type === 'question' && (
            <>
              <div>
                <Label htmlFor="node-question">Pergunta</Label>
                <Textarea
                  id="node-question"
                  value={editingData?.question || ''}
                  onChange={(e) => updateField('question', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Opções de Resposta</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    className="h-8"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {(editingData?.options || []).map((option: string, index: number) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Opção ${index + 1}`}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="h-9 w-9 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}

          {node.type === 'condition' && (
            <div>
              <Label htmlFor="condition">Condição</Label>
              <Textarea
                id="condition"
                value={editingData?.condition || ''}
                onChange={(e) => updateField('condition', e.target.value)}
                rows={3}
              />
            </div>
          )}

          {node.type === 'action' && (
            <>
              <div>
                <Label htmlFor="action-type">Tipo de Ação</Label>
                <Select 
                  value={editingData?.actionType || 'form'} 
                  onValueChange={(value) => updateField('actionType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="form">Formulário</SelectItem>
                    <SelectItem value="transfer">Transferir para Atendente</SelectItem>
                    <SelectItem value="redirect">Redirecionamento</SelectItem>
                    <SelectItem value="api">Chamada API</SelectItem>
                    <SelectItem value="custom">Customizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingData?.actionType === 'form' && (
                <div>
                  <Label>Campos do Formulário</Label>
                  {editingData?.fields?.map((field: any, index: number) => (
                    <div key={index} className="space-y-2 p-3 border rounded-md mb-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nome do campo"
                          value={field.key || ''}
                          onChange={(e) => {
                            const newFields = [...(editingData.fields || [])];
                            newFields[index] = { ...field, key: e.target.value };
                            updateField('fields', newFields);
                          }}
                        />
                        <Select 
                          value={field.type || 'text'} 
                          onValueChange={(value) => {
                            const newFields = [...(editingData.fields || [])];
                            newFields[index] = { ...field, type: value };
                            updateField('fields', newFields);
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texto</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Telefone</SelectItem>
                            <SelectItem value="textarea">Área de texto</SelectItem>
                            <SelectItem value="select">Seleção</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const newFields = (editingData.fields || []).filter((_: any, i: number) => i !== index);
                            updateField('fields', newFields);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Placeholder"
                        value={field.placeholder || ''}
                        onChange={(e) => {
                          const newFields = [...(editingData.fields || [])];
                          newFields[index] = { ...field, placeholder: e.target.value };
                          updateField('fields', newFields);
                        }}
                      />
                      {field.type === 'select' && (
                        <Input
                          placeholder="Opções (separadas por vírgula)"
                          value={field.options?.join(', ') || ''}
                          onChange={(e) => {
                            const newFields = [...(editingData.fields || [])];
                            newFields[index] = { ...field, options: e.target.value.split(',').map(opt => opt.trim()) };
                            updateField('fields', newFields);
                          }}
                        />
                      )}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`required-${index}`}
                          checked={field.required || false}
                          onChange={(e) => {
                            const newFields = [...(editingData.fields || [])];
                            newFields[index] = { ...field, required: e.target.checked };
                            updateField('fields', newFields);
                          }}
                        />
                        <Label htmlFor={`required-${index}`} className="text-sm">Campo obrigatório</Label>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newFields = [...(editingData.fields || []), { 
                        key: '', 
                        placeholder: '', 
                        type: 'text',
                        required: false 
                      }];
                      updateField('fields', newFields);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Campo
                  </Button>
                </div>
              )}

              {editingData?.actionType === 'transfer' && (
                <div>
                  <Label htmlFor="transfer-options">Opções de Transferência</Label>
                  <div className="space-y-2">
                    <Select 
                      value={editingData?.transferType || 'department'} 
                      onValueChange={(value) => updateField('transferType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de transferência" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="department">Departamento</SelectItem>
                        <SelectItem value="agent">Agente Específico</SelectItem>
                        <SelectItem value="queue">Fila de Atendimento</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {editingData?.transferType === 'department' && (
                      <Select 
                        value={editingData?.departments?.[0] || ''} 
                        onValueChange={(value) => updateField('departments', [value])}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um departamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="atendimento">Atendimento</SelectItem>
                          <SelectItem value="comercial">Comercial</SelectItem>
                          <SelectItem value="manutencao">Manutenção</SelectItem>
                          <SelectItem value="financeiro">Financeiro</SelectItem>
                          <SelectItem value="rh">RH</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    
                    {editingData?.transferType === 'agent' && (
                      <Input
                        placeholder="Agentes (separados por vírgula)"
                        value={editingData?.agents?.join(', ') || ''}
                        onChange={(e) => updateField('agents', e.target.value.split(',').map(agent => agent.trim()))}
                      />
                    )}
                    
                    {editingData?.transferType === 'queue' && (
                      <Input
                        placeholder="Nome da fila"
                        value={editingData?.queueName || ''}
                        onChange={(e) => updateField('queueName', e.target.value)}
                      />
                    )}
                  </div>
                </div>
              )}

              {(editingData?.actionType !== 'form' && editingData?.actionType !== 'transfer') && (
                <div>
                  <Label htmlFor="node-action">Configuração da Ação</Label>
                  <Textarea
                    id="node-action"
                    value={editingData?.action || ''}
                    onChange={(e) => updateField('action', e.target.value)}
                    placeholder="Configure os detalhes da ação..."
                    rows={3}
                  />
                </div>
              )}
            </>
          )}

          {node.type === 'end' && (
            <div>
              <Label htmlFor="end-message">Mensagem de Encerramento</Label>
              <Textarea
                id="end-message"
                value={editingData?.message || ''}
                onChange={(e) => updateField('message', e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={onSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={onDelete} 
            className="w-10 h-10 p-0"
            title="Excluir Nó"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}