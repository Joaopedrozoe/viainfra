import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/middleware/auth';
import { 
  PaginationParams,
  PaginatedResponse,
  UserWithoutPassword,
} from '@/types';
import { hashPassword } from '@/utils/auth';
import prisma from '@/utils/database';
import logger from '@/utils/logger';

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'agent' | 'attendant';
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'admin' | 'user' | 'agent' | 'attendant';
  is_active?: boolean;
}

/**
 * Get all users for the user's company
 */
export const getUsers = async (
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
        { email: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build order by clause
    const orderBy: any = {};
    if (sort) {
      orderBy[sort] = order;
    } else {
      orderBy.created_at = 'desc';
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users (excluding password)
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        company_id: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    const response: PaginatedResponse<UserWithoutPassword> = {
      data: users,
      total,
      page: page!,
      limit: limit!,
      totalPages: Math.ceil(total / limit!),
    };

    res.json(response);
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get a specific user by ID
 */
export const getUserById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const company_id = req.user!.company_id;

    const user = await prisma.user.findFirst({
      where: { id, company_id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        company_id: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        assigned_conversations: {
          where: { status: { in: ['active', 'transferred'] } },
          select: {
            id: true,
            contact: {
              select: {
                name: true,
                phone: true,
              },
            },
            channel: {
              select: {
                name: true,
                type: true,
              },
            },
            last_message_at: true,
          },
          orderBy: { last_message_at: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            assigned_conversations: true,
            assigned_tickets: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new user
 */
export const createUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password, role }: CreateUserRequest = req.body;
    const company_id = req.user!.company_id;

    // Only admins can create users
    if (req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Only admins can create users' });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({ message: 'User with this email already exists' });
      return;
    }

    // Hash password
    const password_hash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        role,
        company_id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        company_id: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    logger.info(`User created: ${user.id} by ${req.user!.id}`);
    res.status(201).json(user);
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update a user
 */
export const updateUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, role, is_active }: UpdateUserRequest = req.body;
    const company_id = req.user!.company_id;

    // Only admins can update other users, users can update themselves
    if (req.user!.role !== 'admin' && req.user!.id !== id) {
      res.status(403).json({ message: 'You can only update your own profile' });
      return;
    }

    // Verify user exists and belongs to same company
    const existingUser = await prisma.user.findFirst({
      where: { id, company_id },
    });

    if (!existingUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Only admins can change role and is_active
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    
    if (req.user!.role === 'admin') {
      if (role !== undefined) updateData.role = role;
      if (is_active !== undefined) updateData.is_active = is_active;
    }

    // Check for email conflicts
    if (email && email !== existingUser.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email },
      });

      if (emailConflict) {
        res.status(409).json({ message: 'Email already in use' });
        return;
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        company_id: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    logger.info(`User updated: ${user.id} by ${req.user!.id}`);
    res.json(user);
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a user
 */
export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const company_id = req.user!.company_id;

    // Only admins can delete users
    if (req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Only admins can delete users' });
      return;
    }

    // Users cannot delete themselves
    if (req.user!.id === id) {
      res.status(400).json({ message: 'You cannot delete your own account' });
      return;
    }

    // Verify user exists and belongs to same company
    const existingUser = await prisma.user.findFirst({
      where: { id, company_id },
    });

    if (!existingUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if user has assigned conversations or tickets
    const [assignedConversations, assignedTickets] = await Promise.all([
      prisma.conversation.count({ 
        where: { 
          assigned_to: id,
          status: { in: ['active', 'transferred'] }
        } 
      }),
      prisma.ticket.count({ 
        where: { 
          assigned_to: id,
          status: { in: ['open', 'in_progress'] }
        } 
      }),
    ]);

    if (assignedConversations > 0 || assignedTickets > 0) {
      res.status(400).json({ 
        message: `Cannot delete user with ${assignedConversations} active conversations and ${assignedTickets} open tickets` 
      });
      return;
    }

    // Soft delete by deactivating the user instead of hard delete
    await prisma.user.update({
      where: { id },
      data: { is_active: false },
    });

    logger.info(`User deactivated: ${id} by ${req.user!.id}`);
    res.status(204).send();
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const company_id = req.user!.company_id;

    // Verify user exists and belongs to same company
    const user = await prisma.user.findFirst({
      where: { id, company_id },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Get statistics
    const [
      totalConversations,
      activeConversations,
      resolvedTickets,
      openTickets,
      totalMessages,
    ] = await Promise.all([
      prisma.conversation.count({ where: { assigned_to: id } }),
      prisma.conversation.count({ 
        where: { 
          assigned_to: id, 
          status: { in: ['active', 'transferred'] } 
        } 
      }),
      prisma.ticket.count({ 
        where: { 
          assigned_to: id,
          status: 'resolved'
        } 
      }),
      prisma.ticket.count({ 
        where: { 
          assigned_to: id,
          status: { in: ['open', 'in_progress'] }
        } 
      }),
      prisma.message.count({
        where: {
          sender_type: 'agent',
          sender_id: id,
        }
      }),
    ]);

    const stats = {
      totalConversations,
      activeConversations,
      resolvedTickets,
      openTickets,
      totalMessages,
    };

    res.json(stats);
  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};