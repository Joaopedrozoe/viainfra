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
  X
} from "lucide-react";
import { BotVersion } from "@/pages/app/BotBuilder";

interface BotFlowBuilderProps {
  bot: BotVersion;
  onUpdateBot: (bot: BotVersion) => void;
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
      action: 'collect_ticket_data',
      fields: [
        'PLACA',
        'CORRETIVA', 
        'CANTEIRO OU OFICINA',
        'AGENDAMENTO',
        'DESCRIÇÃO'
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
    id: 'end-conversation',
    type: 'end',
    position: { x: 250, y: 440 },
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
    id: 'e3-5',
    source: 'chamado-1',
    target: 'end-conversation',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: 'e4-5',
    source: 'setor-1',
    target: 'end-conversation', 
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  }
];

export function BotFlowBuilder({ bot, onUpdateBot }: BotFlowBuilderProps) {
  // Inicializar com o fluxo do bot ou com o fluxo padrão se estiver vazio
  const initialNodes = bot.flows.nodes.length > 0 ? bot.flows.nodes : getInitialNodes();
  const initialEdges = bot.flows.edges.length > 0 ? bot.flows.edges : getInitialEdges();
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Salvar mudanças automaticamente
  useEffect(() => {
    const updatedBot = {
      ...bot,
      flows: { nodes, edges },
      updatedAt: new Date().toISOString()
    };
    onUpdateBot(updatedBot);
  }, [nodes, edges]);

  const isEditable = bot.status === 'draft';

  return (
    <div className="h-full flex">
      {/* Flow Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={isEditable ? onNodesChange : undefined}
          onEdgesChange={isEditable ? onEdgesChange : undefined}
          onConnect={isEditable ? onConnect : undefined}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
          nodesDraggable={isEditable}
          nodesConnectable={isEditable}
          elementsSelectable={isEditable}
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
      </div>

      {/* Properties Panel */}
      {selectedNode && (
        <div className="w-80 border-l border-border bg-background p-4">
          <NodePropertiesPanel 
            node={selectedNode}
            onUpdateNode={(updatedNode) => {
              setNodes(nds => nds.map(n => n.id === updatedNode.id ? updatedNode : n));
            }}
          />
        </div>
      )}
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
      {data.action && (
        <div className="mt-1 text-xs">
          {data.action}
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

// Painel de Propriedades do Nó
function NodePropertiesPanel({ 
  node, 
  onUpdateNode 
}: { 
  node: Node; 
  onUpdateNode: (node: Node) => void;
}) {
  return (
    <Card className="h-full">
      <div className="p-4">
        <h3 className="font-semibold mb-4">Propriedades do Nó</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="node-label">Nome do Nó</Label>
            <Input
              id="node-label"
              value={(node.data?.label as string) || ''}
              onChange={(e) => onUpdateNode({
                ...node,
                data: { ...node.data, label: e.target.value }
              })}
            />
          </div>

          {node.type === 'message' && (
            <div>
              <Label htmlFor="node-message">Mensagem</Label>
              <Textarea
                id="node-message"
                value={(node.data?.message as string) || ''}
                onChange={(e) => onUpdateNode({
                  ...node,
                  data: { ...node.data, message: e.target.value }
                })}
              />
            </div>
          )}

          {node.type === 'question' && (
            <>
              <div>
                <Label htmlFor="node-question">Pergunta</Label>
                <Textarea
                  id="node-question"
                  value={(node.data?.question as string) || ''}
                  onChange={(e) => onUpdateNode({
                    ...node,
                    data: { ...node.data, question: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>Opções de Resposta</Label>
                {(node.data?.options as string[] || []).map((option: string, index: number) => (
                  <Input
                    key={index}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...((node.data?.options as string[]) || [])];
                      newOptions[index] = e.target.value;
                      onUpdateNode({
                        ...node,
                        data: { ...node.data, options: newOptions }
                      });
                    }}
                    className="mt-2"
                  />
                ))}
              </div>
            </>
          )}

          {node.type === 'end' && (
            <div>
              <Label htmlFor="end-message">Mensagem de Encerramento</Label>
              <Textarea
                id="end-message"
                value={(node.data?.message as string) || ''}
                onChange={(e) => onUpdateNode({
                  ...node,
                  data: { ...node.data, message: e.target.value }
                })}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}