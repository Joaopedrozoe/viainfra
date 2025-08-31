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

interface BotFlowBuilderProps {
  bot: BotVersion;
  onUpdateBot: (bot: BotVersion) => void;
  onFlowChange?: () => void;
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
    position: { x: 250, y: 0 },
    data: { 
      label: 'Início',
      message: 'Bem-vindo ao autoatendimento da ViaInfra 👋\nComo podemos ajudar hoje?'
    }
  },
  {
    id: 'menu-1', 
    type: 'question',
    position: { x: 250, y: 120 },
    data: {
      label: 'Menu Principal',
      question: 'Escolha uma opção:',
      options: ['Abertura de Chamado', 'Falar com Atendente']
    }
  },
  {
    id: 'chamado-1',
    type: 'action',
    position: { x: 100, y: 280 },
    data: {
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
    }
  },
  {
    id: 'setor-1',
    type: 'question',
    position: { x: 400, y: 280 },
    data: {
      label: 'Escolha do Setor',
      question: 'Selecione o setor para transferência:',
      options: ['Atendimento', 'Comercial', 'Manutenção', 'Financeiro', 'RH']
    }
  },
  {
    id: 'transfer-atendimento',
    type: 'action',
    position: { x: 600, y: 320 },
    data: {
      label: 'Transferir - Atendimento',
      actionType: 'transfer',
      action: 'Transferir para Joicy Souza (Atendimento)'
    }
  },
  {
    id: 'transfer-comercial',
    type: 'action',
    position: { x: 600, y: 380 },
    data: {
      label: 'Transferir - Comercial',
      actionType: 'transfer',
      action: 'Transferir para Elisabete Silva (Comercial)'
    }
  },
  {
    id: 'transfer-manutencao',
    type: 'action',
    position: { x: 600, y: 440 },
    data: {
      label: 'Transferir - Manutenção',
      actionType: 'transfer',
      action: 'Transferir para Suelem Souza (Manutenção)'
    }
  },
  {
    id: 'transfer-financeiro',
    type: 'action',
    position: { x: 600, y: 500 },
    data: {
      label: 'Transferir - Financeiro',
      actionType: 'transfer',
      action: 'Transferir para Giovanna Ferreira (Financeiro)'
    }
  },
  {
    id: 'transfer-rh',
    type: 'action',
    position: { x: 600, y: 560 },
    data: {
      label: 'Transferir - RH',
      actionType: 'transfer',
      action: 'Transferir para Sandra Romano (RH)'
    }
  },
  {
    id: 'opcoes-pos-chamado',
    type: 'question',
    position: { x: 100, y: 420 },
    data: {
      label: 'Opções Pós-Chamado',
      question: 'O que deseja fazer agora?',
      options: ['Falar com Atendente', 'Menu Principal']
    }
  },
  {
    id: 'end-conversation',
    type: 'end',
    position: { x: 250, y: 620 },
    data: {
      label: 'Encerrar Conversa',
      message: 'Obrigado por utilizar nosso atendimento! 👋'
    }
  }
];

const getInitialEdges = (): Edge[] => [
  {
    id: 'e1-2',
    source: 'start-1',
    target: 'menu-1',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'e2-3',
    source: 'menu-1',
    target: 'chamado-1',
    type: 'smoothstep',
    label: 'Abertura de Chamado',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'e2-4',
    source: 'menu-1', 
    target: 'setor-1',
    type: 'smoothstep',
    label: 'Falar com Atendente',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'e3-opcoes',
    source: 'chamado-1',
    target: 'opcoes-pos-chamado',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  // Fluxo das opções pós-chamado
  {
    id: 'e-opcoes-atendente',
    source: 'opcoes-pos-chamado',
    target: 'setor-1',
    label: 'Falar com Atendente',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'e-opcoes-menu',
    source: 'opcoes-pos-chamado',
    target: 'start-1',
    label: 'Menu Principal',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  // Conexões diretas para cada transferência específica
  {
    id: 'e-setor-atendimento',
    source: 'setor-1',
    target: 'transfer-atendimento',
    label: 'Atendimento',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'e-setor-comercial',
    source: 'setor-1',
    target: 'transfer-comercial',
    label: 'Comercial',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'e-setor-manutencao',
    source: 'setor-1',
    target: 'transfer-manutencao',
    label: 'Manutenção',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'e-setor-financeiro',
    source: 'setor-1',
    target: 'transfer-financeiro',
    label: 'Financeiro',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'e-setor-rh',
    source: 'setor-1',
    target: 'transfer-rh',
    label: 'RH',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  }
];

export function BotFlowBuilder({ bot, onUpdateBot, onFlowChange }: BotFlowBuilderProps) {
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

// Componentes de Nós Customizados
function StartNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-green-500 text-white border-2 border-green-600">
      <div className="flex items-center">
        <Play className="h-4 w-4 mr-2" />
        <div className="text-sm font-bold">{data.label}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-green-600"
      />
    </div>
  );
}

function MessageNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-blue-500 text-white border-2 border-blue-600">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-600"
      />
      <div className="flex items-center">
        <MessageSquare className="h-4 w-4 mr-2" />
        <div className="text-sm font-bold">{data.label}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-600"
      />
    </div>
  );
}

function QuestionNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-purple-500 text-white border-2 border-purple-600">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-purple-600"
      />
      <div className="flex items-center">
        <MessageSquare className="h-4 w-4 mr-2" />
        <div className="text-sm font-bold">{data.label}</div>
      </div>
      {data.options && (
        <div className="mt-1 text-xs">
          {data.options.length} opções
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-purple-600"
      />
    </div>
  );
}

function ConditionNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-yellow-500 text-white border-2 border-yellow-600">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-yellow-600"
      />
      <div className="flex items-center">
        <Settings className="h-4 w-4 mr-2" />
        <div className="text-sm font-bold">{data.label}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-yellow-600"
      />
    </div>
  );
}

function ActionNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-orange-500 text-white border-2 border-orange-600">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-orange-600"
      />
      <div className="flex items-center">
        <Settings className="h-4 w-4 mr-2" />
        <div className="text-sm font-bold">{data.label}</div>
      </div>
      {data.actionType && (
        <div className="mt-1 text-xs">
          {data.actionType === 'form' ? `${data.fields?.length || 0} campos` : data.actionType}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-orange-600"
      />
    </div>
  );
}

function EndNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-red-500 text-white border-2 border-red-600">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-red-600"
      />
      <div className="flex items-center">
        <X className="h-4 w-4 mr-2" />
        <div className="text-sm font-bold">{data.label}</div>
      </div>
    </div>
  );
}

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
                      <Input
                        placeholder="Departamentos (separados por vírgula)"
                        value={editingData?.departments?.join(', ') || ''}
                        onChange={(e) => updateField('departments', e.target.value.split(',').map(dept => dept.trim()))}
                      />
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