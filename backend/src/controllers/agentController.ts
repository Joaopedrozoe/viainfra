import { Response } from 'express';
import { AuthenticatedRequest } from '@/middleware/auth';
import { 
  CreateAgentRequest, 
  PaginationParams,
  PaginatedResponse,
  Agent,
} from '@/types';
import prisma from '@/utils/database';
import logger from '@/utils/logger';

// Extended types for agent management
export interface CreateAgentRequestFull extends CreateAgentRequest {
  knowledgeFiles?: string[];
  knowledgeQA?: { question: string; answer: string }[];
  knowledgeURLs?: string[];
  processes?: { id: string; order: number; description: string }[];
  integrations?: {
    type: 'n8n' | 'zapier' | 'custom';
    webhookUrl?: string;
    headers?: string;
    payloadTemplate?: string;
    enabled: boolean;
  }[];
}

export interface UpdateAgentRequest {
  name?: string;
  function?: 'SDR' | 'Suporte' | 'Vendas' | 'Genérico';
  tone?: string;
  description?: string;
  channels?: string[];
  status?: 'active' | 'training' | 'error';
  knowledgeFiles?: string[];
  knowledgeQA?: { question: string; answer: string }[];
  knowledgeURLs?: string[];
  processes?: { id: string; order: number; description: string }[];
  integrations?: {
    type: 'n8n' | 'zapier' | 'custom';
    webhookUrl?: string;
    headers?: string;
    payloadTemplate?: string;
    enabled: boolean;
  }[];
}

/**
 * Get all agents for the user's company
 */
export const getAgents = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { page, limit, search, sort, order }: PaginationParams = req.query;
    const company_id = req.user!.company_id;

    const skip = (page! - 1) * limit!;
    
    // Since agents are stored in a separate system, we'll simulate the data
    // In a real implementation, this would query your agents database or external service
    
    // For now, we'll create mock data that matches the frontend expectations
    const mockAgents: Agent[] = [
      {
        id: '1',
        name: 'Agente de Vendas',
        function: 'Vendas',
        status: 'active',
        tone: 'Profissional e persuasivo',
        description: 'Especializado em converter leads em vendas',
        channels: ['whatsapp', 'instagram'],
        knowledgeFiles: ['produtos.pdf', 'precos.xlsx'],
        knowledgeQA: [
          { question: 'Qual o horário de funcionamento?', answer: 'Funcionamos de segunda a sexta, das 8h às 18h.' }
        ],
        knowledgeURLs: ['https://empresa.com/produtos'],
        template: 'Vendas',
        processes: [
          { id: '1', order: 1, description: 'Qualificar lead' },
          { id: '2', order: 2, description: 'Apresentar produto' },
          { id: '3', order: 3, description: 'Negociar preço' }
        ],
        integrations: [{
          type: 'n8n',
          webhookUrl: 'https://webhook.n8n.io/vendas',
          enabled: true
        }],
        company_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metrics: {
          conversations: 45,
          successRate: 78.5,
          humanTransfers: 8
        }
      },
      {
        id: '2',
        name: 'Suporte Técnico',
        function: 'Suporte',
        status: 'active',
        tone: 'Amigável e técnico',
        description: 'Ajuda com problemas técnicos e dúvidas',
        channels: ['whatsapp', 'email'],
        knowledgeFiles: ['manual-tecnico.pdf'],
        knowledgeQA: [
          { question: 'Como resetar senha?', answer: 'Acesse a página de login e clique em "Esqueci minha senha".' }
        ],
        knowledgeURLs: ['https://empresa.com/suporte'],
        template: 'Suporte N1',
        processes: [
          { id: '1', order: 1, description: 'Identificar problema' },
          { id: '2', order: 2, description: 'Buscar solução' },
          { id: '3', order: 3, description: 'Resolver ou escalar' }
        ],
        company_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metrics: {
          conversations: 120,
          successRate: 92.3,
          humanTransfers: 12
        }
      }
    ];

    // Filter by search if provided
    let filteredAgents = mockAgents;
    if (search) {
      filteredAgents = mockAgents.filter(agent => 
        agent.name.toLowerCase().includes(search.toLowerCase()) ||
        agent.function.toLowerCase().includes(search.toLowerCase()) ||
        agent.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply pagination
    const total = filteredAgents.length;
    const paginatedAgents = filteredAgents.slice(skip, skip + limit!);

    const response: PaginatedResponse<Agent> = {
      data: paginatedAgents,
      total,
      page: page!,
      limit: limit!,
      totalPages: Math.ceil(total / limit!),
    };

    res.json(response);
  } catch (error) {
    logger.error('Get agents error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get a specific agent by ID
 */
export const getAgentById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const company_id = req.user!.company_id;

    // In a real implementation, this would query your agents database
    const mockAgent: Agent = {
      id,
      name: 'Agente de Vendas',
      function: 'Vendas',
      status: 'active',
      tone: 'Profissional e persuasivo',
      description: 'Especializado em converter leads em vendas',
      channels: ['whatsapp', 'instagram'],
      knowledgeFiles: ['produtos.pdf', 'precos.xlsx'],
      knowledgeQA: [
        { question: 'Qual o horário de funcionamento?', answer: 'Funcionamos de segunda a sexta, das 8h às 18h.' }
      ],
      knowledgeURLs: ['https://empresa.com/produtos'],
      template: 'Vendas',
      processes: [
        { id: '1', order: 1, description: 'Qualificar lead' },
        { id: '2', order: 2, description: 'Apresentar produto' },
        { id: '3', order: 3, description: 'Negociar preço' }
      ],
      integrations: [{
        type: 'n8n',
        webhookUrl: 'https://webhook.n8n.io/vendas',
        enabled: true
      }],
      company_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metrics: {
        conversations: 45,
        successRate: 78.5,
        humanTransfers: 8
      }
    };

    res.json(mockAgent);
  } catch (error) {
    logger.error('Get agent by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new agent
 */
export const createAgent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const agentData: CreateAgentRequestFull = req.body;
    const company_id = req.user!.company_id;

    // In a real implementation, this would create the agent in your system
    const newAgent: Agent = {
      id: Date.now().toString(),
      name: agentData.name,
      function: agentData.function,
      status: 'training',
      tone: agentData.tone,
      description: agentData.description,
      channels: agentData.channels,
      knowledgeFiles: agentData.knowledgeFiles || [],
      knowledgeQA: agentData.knowledgeQA || [],
      knowledgeURLs: agentData.knowledgeURLs || [],
      template: agentData.template,
      processes: agentData.processes || [],
      integrations: agentData.integrations || [],
      company_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metrics: {
        conversations: 0,
        successRate: 0,
        humanTransfers: 0
      }
    };

    logger.info(`Agent created: ${newAgent.id} for company ${company_id}`);
    res.status(201).json(newAgent);
  } catch (error) {
    logger.error('Create agent error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update an agent
 */
export const updateAgent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateAgentRequest = req.body;
    const company_id = req.user!.company_id;

    // In a real implementation, this would update the agent in your system
    const updatedAgent: Agent = {
      id,
      name: updateData.name || 'Agente Atualizado',
      function: updateData.function || 'Genérico',
      status: updateData.status || 'active',
      tone: updateData.tone || 'Neutro',
      description: updateData.description || 'Agente atualizado',
      channels: updateData.channels || ['whatsapp'],
      knowledgeFiles: updateData.knowledgeFiles || [],
      knowledgeQA: updateData.knowledgeQA || [],
      knowledgeURLs: updateData.knowledgeURLs || [],
      template: 'Genérico',
      processes: updateData.processes || [],
      integrations: updateData.integrations || [],
      company_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metrics: {
        conversations: 10,
        successRate: 85.0,
        humanTransfers: 3
      }
    };

    logger.info(`Agent updated: ${id}`);
    res.json(updatedAgent);
  } catch (error) {
    logger.error('Update agent error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete an agent
 */
export const deleteAgent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const company_id = req.user!.company_id;

    // In a real implementation, this would delete the agent from your system
    // and handle any cleanup (like removing from active conversations)

    logger.info(`Agent deleted: ${id}`);
    res.status(204).send();
  } catch (error) {
    logger.error('Delete agent error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get agent metrics
 */
export const getAgentMetrics = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const company_id = req.user!.company_id;

    // In a real implementation, this would fetch real metrics from your system
    const metrics = {
      conversations: {
        total: 156,
        thisWeek: 23,
        thisMonth: 89,
      },
      successRate: {
        overall: 82.5,
        thisWeek: 85.2,
        thisMonth: 81.3,
      },
      humanTransfers: {
        total: 18,
        thisWeek: 3,
        thisMonth: 12,
        rate: 11.5, // percentage
      },
      responseTime: {
        average: 2.3, // seconds
        thisWeek: 2.1,
        thisMonth: 2.4,
      },
      topQuestions: [
        { question: 'Qual o horário de funcionamento?', count: 45 },
        { question: 'Como posso cancelar meu pedido?', count: 32 },
        { question: 'Quais são as formas de pagamento?', count: 28 },
      ],
      channels: {
        whatsapp: { conversations: 120, successRate: 84.2 },
        instagram: { conversations: 36, successRate: 78.1 },
      },
    };

    res.json(metrics);
  } catch (error) {
    logger.error('Get agent metrics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};