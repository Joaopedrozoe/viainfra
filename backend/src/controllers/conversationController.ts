import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { 
  CreateConversationRequest, 
  SendMessageRequest, 
  PaginationParams,
  PaginatedResponse,
  Conversation,
  Message 
} from '../types';
import prisma from '../utils/database';
import logger from '../utils/logger';

/**
 * Get all conversations for the user's company
 */
export const getConversations = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { page, limit, search, sort, order }: PaginationParams = req.query;
    const company_id = req.user!.company_id;

    const skip = (page! - 1) * limit!;
    
    // Build where clause
    const where: any = { company_id };
    
    if (search) {
      where.OR = [
        { contact: { name: { contains: search, mode: 'insensitive' } } },
        { contact: { phone: { contains: search, mode: 'insensitive' } } },
        { contact: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Build order by clause
    const orderBy: any = {};
    if (sort) {
      orderBy[sort] = order;
    } else {
      orderBy.last_message_at = 'desc';
    }

    // Get total count
    const total = await prisma.conversation.count({ where });

    // Get conversations with relations
    const conversations = await prisma.conversation.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            avatar_url: true,
          },
        },
        channel: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
          },
        },
        assigned_user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            content: true,
            message_type: true,
            sender_type: true,
            created_at: true,
          },
        },
      },
    });

    const response: PaginatedResponse<Conversation> = {
      data: conversations as any,
      total,
      page: page!,
      limit: limit!,
      totalPages: Math.ceil(total / limit!),
    };

    res.json(response);
  } catch (error) {
    logger.error('Get conversations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get messages for a specific conversation
 */
export const getConversationMessages = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { page, limit }: PaginationParams = req.query;
    const company_id = req.user!.company_id;

    const skip = (page! - 1) * limit!;

    // Verify conversation belongs to user's company
    const conversation = await prisma.conversation.findFirst({
      where: { id, company_id },
    });

    if (!conversation) {
      res.status(404).json({ message: 'Conversation not found' });
      return;
    }

    // Get total count
    const total = await prisma.message.count({
      where: { conversation_id: id },
    });

    // Get messages
    const messages = await prisma.message.findMany({
      where: { conversation_id: id },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    });

    const response: PaginatedResponse<Message> = {
      data: messages.reverse().map(message => ({
        ...message,
        message_type: message.message_type as 'text' | 'image' | 'audio' | 'document' | 'location' | 'contact',
        sender_id: message.sender_id || undefined,
        external_id: message.external_id || undefined,
        metadata: message.metadata as Record<string, any>,
        created_at: message.created_at.toISOString(),
      })), // Reverse to show oldest first
      total,
      page: page!,
      limit: limit!,
      totalPages: Math.ceil(total / limit!),
    };

    res.json(response);
  } catch (error) {
    logger.error('Get conversation messages error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Send a message in a conversation
 */
export const sendMessage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, message_type, metadata }: SendMessageRequest = req.body;
    const company_id = req.user!.company_id;
    const user_id = req.user!.id;

    // Verify conversation belongs to user's company
    const conversation = await prisma.conversation.findFirst({
      where: { id, company_id },
      include: {
        channel: true,
      },
    });

    if (!conversation) {
      res.status(404).json({ message: 'Conversation not found' });
      return;
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversation_id: id,
        content,
        message_type: message_type || 'text',
        sender_type: 'agent',
        sender_id: user_id,
        metadata: metadata || {},
      },
    });

    // Update conversation last_message_at
    await prisma.conversation.update({
      where: { id },
      data: { last_message_at: new Date() },
    });

    // TODO: Send message via WhatsApp API (Evolution API)
    // This would be implemented based on the channel type

    logger.info(`Message sent in conversation ${id} by user ${user_id}`);
    res.status(201).json(message);
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Assign conversation to a user
 */
export const assignConversation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;
    const company_id = req.user!.company_id;

    // Verify conversation belongs to user's company
    const conversation = await prisma.conversation.findFirst({
      where: { id, company_id },
    });

    if (!conversation) {
      res.status(404).json({ message: 'Conversation not found' });
      return;
    }

    // Verify assigned user belongs to same company
    if (assigned_to) {
      const assignedUser = await prisma.user.findFirst({
        where: { id: assigned_to, company_id },
      });

      if (!assignedUser) {
        res.status(400).json({ message: 'Invalid assigned user' });
        return;
      }
    }

    // Update conversation
    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: { assigned_to },
      include: {
        contact: true,
        channel: true,
        assigned_user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    logger.info(`Conversation ${id} assigned to user ${assigned_to}`);
    res.json(updatedConversation);
  } catch (error) {
    logger.error('Assign conversation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new conversation
 */
export const createConversation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { contact_id, channel_id, bot_id }: CreateConversationRequest = req.body;
    const company_id = req.user!.company_id;

    // Verify contact and channel belong to user's company
    const [contact, channel] = await Promise.all([
      prisma.contact.findFirst({ where: { id: contact_id, company_id } }),
      prisma.channel.findFirst({ where: { id: channel_id, company_id } }),
    ]);

    if (!contact) {
      res.status(400).json({ message: 'Invalid contact' });
      return;
    }

    if (!channel) {
      res.status(400).json({ message: 'Invalid channel' });
      return;
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        contact_id,
        channel_id,
        company_id,
        status: { in: ['active', 'transferred'] },
      },
    });

    if (existingConversation) {
      res.status(409).json({ 
        message: 'Active conversation already exists',
        conversation: existingConversation,
      });
      return;
    }

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        contact_id,
        channel_id,
        bot_id,
        company_id,
        status: 'active',
        metadata: {},
      },
      include: {
        contact: true,
        channel: true,
        assigned_user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    logger.info(`New conversation created: ${conversation.id}`);
    res.status(201).json(conversation);
  } catch (error) {
    logger.error('Create conversation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};