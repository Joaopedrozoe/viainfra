import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { 
  CreateContactRequest, 
  UpdateContactRequest, 
  PaginationParams,
  PaginatedResponse,
  Contact 
} from '../types';
import prisma from '../utils/database';
import logger from '../utils/logger';

/**
 * Get all contacts for the user's company
 */
export const getContacts = async (
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
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
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
    const total = await prisma.contact.count({ where });

    // Get contacts
    const contacts = await prisma.contact.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    });

    const response: PaginatedResponse<Contact> = {
      data: contacts.map(contact => ({
        ...contact,
        name: contact.name || undefined,
        email: contact.email || undefined,
        avatar_url: contact.avatar_url || undefined,
        metadata: contact.metadata as Record<string, any>,
        created_at: contact.created_at.toISOString(),
        updated_at: contact.updated_at.toISOString(),
      })),
      total,
      page: page!,
      limit: limit!,
      totalPages: Math.ceil(total / limit!),
    };

    res.json(response);
  } catch (error) {
    logger.error('Get contacts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get a specific contact by ID
 */
export const getContactById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const company_id = req.user!.company_id;

    const contact = await prisma.contact.findFirst({
      where: { id, company_id },
      include: {
        conversations: {
          include: {
            channel: {
              select: {
                id: true,
                name: true,
                type: true,
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
          orderBy: { last_message_at: 'desc' },
        },
      },
    });

    if (!contact) {
      res.status(404).json({ message: 'Contact not found' });
      return;
    }

    res.json(contact);
  } catch (error) {
    logger.error('Get contact by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new contact
 */
export const createContact = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, phone, email, metadata }: CreateContactRequest = req.body;
    const company_id = req.user!.company_id;

    // Check if contact with same phone already exists in this company
    const existingContact = await prisma.contact.findFirst({
      where: { phone, company_id },
    });

    if (existingContact) {
      res.status(409).json({ 
        message: 'Contact with this phone number already exists',
        contact: existingContact 
      });
      return;
    }

    const contact = await prisma.contact.create({
      data: {
        name,
        phone,
        email,
        metadata: metadata || {},
        company_id,
      },
    });

    logger.info(`Contact created: ${contact.id} for company ${company_id}`);
    res.status(201).json(contact);
  } catch (error) {
    logger.error('Create contact error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update a contact
 */
export const updateContact = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, metadata }: UpdateContactRequest = req.body;
    const company_id = req.user!.company_id;

    // Verify contact exists and belongs to user's company
    const existingContact = await prisma.contact.findFirst({
      where: { id, company_id },
    });

    if (!existingContact) {
      res.status(404).json({ message: 'Contact not found' });
      return;
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(metadata !== undefined && { metadata }),
        updated_at: new Date(),
      },
    });

    logger.info(`Contact updated: ${contact.id}`);
    res.json(contact);
  } catch (error) {
    logger.error('Update contact error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a contact
 */
export const deleteContact = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const company_id = req.user!.company_id;

    // Verify contact exists and belongs to user's company
    const existingContact = await prisma.contact.findFirst({
      where: { id, company_id },
    });

    if (!existingContact) {
      res.status(404).json({ message: 'Contact not found' });
      return;
    }

    // Delete contact (this will cascade to conversations and messages)
    await prisma.contact.delete({
      where: { id },
    });

    logger.info(`Contact deleted: ${id}`);
    res.status(204).send();
  } catch (error) {
    logger.error('Delete contact error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get contact conversation history
 */
export const getContactHistory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { page, limit }: PaginationParams = req.query;
    const company_id = req.user!.company_id;

    const skip = (page! - 1) * limit!;

    // Verify contact exists and belongs to user's company
    const contact = await prisma.contact.findFirst({
      where: { id, company_id },
    });

    if (!contact) {
      res.status(404).json({ message: 'Contact not found' });
      return;
    }

    // Get conversations with messages
    const total = await prisma.conversation.count({
      where: { contact_id: id, company_id },
    });

    const conversations = await prisma.conversation.findMany({
      where: { contact_id: id, company_id },
      skip,
      take: limit,
      orderBy: { last_message_at: 'desc' },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        assigned_user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: { created_at: 'asc' },
          select: {
            id: true,
            content: true,
            message_type: true,
            sender_type: true,
            sender_id: true,
            created_at: true,
          },
        },
      },
    });

    const response: PaginatedResponse<any> = {
      data: conversations,
      total,
      page: page!,
      limit: limit!,
      totalPages: Math.ceil(total / limit!),
    };

    res.json(response);
  } catch (error) {
    logger.error('Get contact history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};