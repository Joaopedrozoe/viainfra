import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/middleware/auth';
import { 
  CreateChannelRequest, 
  UpdateChannelRequest, 
  PaginationParams,
  PaginatedResponse,
  Channel 
} from '@/types';
import prisma from '@/utils/database';
import logger from '@/utils/logger';

/**
 * Get all channels for the user's company
 */
export const getChannels = async (
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
        { name: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
        { phone_number: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build order by clause
    const orderBy: any = {};
    if (sort) {
      orderBy[sort] = order;
    } else {
      orderBy.updated_at = 'desc';
    }

    // Get total count
    const total = await prisma.channel.count({ where });

    // Get channels
    const channels = await prisma.channel.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        _count: {
          select: {
            conversations: true,
            webhook_events: true,
          },
        },
      },
    });

    const response: PaginatedResponse<Channel> = {
      data: channels as any,
      total,
      page: page!,
      limit: limit!,
      totalPages: Math.ceil(total / limit!),
    };

    res.json(response);
  } catch (error) {
    logger.error('Get channels error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get a specific channel by ID
 */
export const getChannelById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const company_id = req.user!.company_id;

    const channel = await prisma.channel.findFirst({
      where: { id, company_id },
      include: {
        _count: {
          select: {
            conversations: true,
            webhook_events: true,
          },
        },
        channel_bots: {
          include: {
            bot: {
              select: {
                id: true,
                name: true,
                is_active: true,
              },
            },
          },
        },
      },
    });

    if (!channel) {
      res.status(404).json({ message: 'Channel not found' });
      return;
    }

    res.json(channel);
  } catch (error) {
    logger.error('Get channel by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new channel
 */
export const createChannel = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { 
      name, 
      type, 
      phone_number, 
      instance_id, 
      api_key, 
      webhook_url, 
      settings 
    }: CreateChannelRequest = req.body;
    const company_id = req.user!.company_id;

    // Check for duplicate channel names within the company
    const existingChannel = await prisma.channel.findFirst({
      where: { 
        name, 
        company_id,
      },
    });

    if (existingChannel) {
      res.status(409).json({ 
        message: 'Channel with this name already exists' 
      });
      return;
    }

    const channel = await prisma.channel.create({
      data: {
        name,
        type,
        phone_number,
        instance_id,
        api_key,
        webhook_url,
        settings: settings || {},
        company_id,
        status: 'disconnected', // Default status
      },
    });

    logger.info(`Channel created: ${channel.id} for company ${company_id}`);
    res.status(201).json(channel);
  } catch (error) {
    logger.error('Create channel error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update a channel
 */
export const updateChannel = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      name, 
      status, 
      phone_number, 
      instance_id, 
      api_key, 
      webhook_url, 
      settings 
    }: UpdateChannelRequest = req.body;
    const company_id = req.user!.company_id;

    // Verify channel exists and belongs to user's company
    const existingChannel = await prisma.channel.findFirst({
      where: { id, company_id },
    });

    if (!existingChannel) {
      res.status(404).json({ message: 'Channel not found' });
      return;
    }

    // Check for duplicate names if name is being updated
    if (name && name !== existingChannel.name) {
      const duplicateChannel = await prisma.channel.findFirst({
        where: { 
          name, 
          company_id,
          id: { not: id },
        },
      });

      if (duplicateChannel) {
        res.status(409).json({ 
          message: 'Channel with this name already exists' 
        });
        return;
      }
    }

    const channel = await prisma.channel.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(status !== undefined && { status }),
        ...(phone_number !== undefined && { phone_number }),
        ...(instance_id !== undefined && { instance_id }),
        ...(api_key !== undefined && { api_key }),
        ...(webhook_url !== undefined && { webhook_url }),
        ...(settings !== undefined && { settings }),
        updated_at: new Date(),
      },
    });

    logger.info(`Channel updated: ${channel.id}`);
    res.json(channel);
  } catch (error) {
    logger.error('Update channel error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a channel
 */
export const deleteChannel = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const company_id = req.user!.company_id;

    // Verify channel exists and belongs to user's company
    const existingChannel = await prisma.channel.findFirst({
      where: { id, company_id },
    });

    if (!existingChannel) {
      res.status(404).json({ message: 'Channel not found' });
      return;
    }

    // Check if channel has active conversations
    const activeConversations = await prisma.conversation.count({
      where: { 
        channel_id: id, 
        status: { in: ['active', 'transferred'] } 
      },
    });

    if (activeConversations > 0) {
      res.status(400).json({ 
        message: `Cannot delete channel with ${activeConversations} active conversations` 
      });
      return;
    }

    // Delete channel (this will cascade to conversations and messages)
    await prisma.channel.delete({
      where: { id },
    });

    logger.info(`Channel deleted: ${id}`);
    res.status(204).send();
  } catch (error) {
    logger.error('Delete channel error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get channel statistics
 */
export const getChannelStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const company_id = req.user!.company_id;

    // Verify channel exists and belongs to user's company
    const channel = await prisma.channel.findFirst({
      where: { id, company_id },
    });

    if (!channel) {
      res.status(404).json({ message: 'Channel not found' });
      return;
    }

    // Get statistics
    const [
      totalConversations,
      activeConversations,
      totalMessages,
      todayMessages,
      totalWebhooks,
    ] = await Promise.all([
      prisma.conversation.count({ where: { channel_id: id } }),
      prisma.conversation.count({ 
        where: { 
          channel_id: id, 
          status: { in: ['active', 'transferred'] } 
        } 
      }),
      prisma.message.count({ 
        where: { 
          conversation: { channel_id: id } 
        } 
      }),
      prisma.message.count({ 
        where: { 
          conversation: { channel_id: id },
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        } 
      }),
      prisma.webhookEvent.count({ where: { channel_id: id } }),
    ]);

    const stats = {
      totalConversations,
      activeConversations,
      totalMessages,
      todayMessages,
      totalWebhooks,
      lastActivity: channel.updated_at,
    };

    res.json(stats);
  } catch (error) {
    logger.error('Get channel stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};