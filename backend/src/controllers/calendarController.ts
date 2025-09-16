import { Response } from 'express';
import { AuthenticatedRequest } from '@/middleware/auth';
import { 
  CreateCalendarEventRequest,
  PaginationParams,
  PaginatedResponse,
  CalendarEvent,
} from '@/types';
import prisma from '@/utils/database';
import logger from '@/utils/logger';

export interface UpdateCalendarEventRequest {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  all_day?: boolean;
}

/**
 * Get all calendar events for the user's company
 */
export const getCalendarEvents = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { page, limit, search, sort, order }: PaginationParams = req.query;
    const { start_date, end_date } = req.query;
    const company_id = req.user!.company_id;

    // Since calendar events aren't in the Prisma schema yet, we'll create mock data
    // In a real implementation, you would add the calendar_events table to the schema
    
    const mockEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'Reunião de Vendas',
        description: 'Reunião semanal da equipe de vendas',
        start_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        end_date: new Date(Date.now() + 86400000 + 3600000).toISOString(), // Tomorrow + 1 hour
        all_day: false,
        company_id,
        created_by: req.user!.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Treinamento de Produto',
        description: 'Treinamento sobre novos produtos para a equipe',
        start_date: new Date(Date.now() + 2 * 86400000).toISOString(), // Day after tomorrow
        end_date: new Date(Date.now() + 2 * 86400000 + 7200000).toISOString(), // Day after tomorrow + 2 hours
        all_day: false,
        company_id,
        created_by: req.user!.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '3',
        title: 'Feriado Nacional',
        description: 'Independência do Brasil',
        start_date: '2024-09-07T00:00:00.000Z',
        end_date: '2024-09-07T23:59:59.999Z',
        all_day: true,
        company_id,
        created_by: req.user!.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '4',
        title: 'Apresentação para Cliente',
        description: 'Apresentação da proposta para novo cliente',
        start_date: new Date(Date.now() + 3 * 86400000).toISOString(), // 3 days from now
        end_date: new Date(Date.now() + 3 * 86400000 + 5400000).toISOString(), // 3 days from now + 1.5 hours
        all_day: false,
        company_id,
        created_by: req.user!.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Filter by date range if provided
    let filteredEvents = mockEvents;
    if (start_date && end_date) {
      const startFilter = new Date(start_date as string);
      const endFilter = new Date(end_date as string);
      
      filteredEvents = mockEvents.filter(event => {
        const eventStart = new Date(event.start_date);
        const eventEnd = new Date(event.end_date);
        
        return (eventStart >= startFilter && eventStart <= endFilter) ||
               (eventEnd >= startFilter && eventEnd <= endFilter) ||
               (eventStart <= startFilter && eventEnd >= endFilter);
      });
    }

    // Filter by search if provided
    if (search) {
      filteredEvents = filteredEvents.filter(event => 
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Apply sorting
    if (sort) {
      filteredEvents.sort((a, b) => {
        const aValue = (a as any)[sort];
        const bValue = (b as any)[sort];
        if (order === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    } else {
      // Default sort by start_date
      filteredEvents.sort((a, b) => 
        order === 'asc' 
          ? new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
          : new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
    }

    // Apply pagination
    const skip = (page! - 1) * limit!;
    const total = filteredEvents.length;
    const paginatedEvents = filteredEvents.slice(skip, skip + limit!);

    const response: PaginatedResponse<CalendarEvent> = {
      data: paginatedEvents,
      total,
      page: page!,
      limit: limit!,
      totalPages: Math.ceil(total / limit!),
    };

    res.json(response);
  } catch (error) {
    logger.error('Get calendar events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get a specific calendar event by ID
 */
export const getCalendarEventById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const company_id = req.user!.company_id;

    // Mock event data
    const mockEvent: CalendarEvent = {
      id,
      title: 'Reunião de Vendas',
      description: 'Reunião semanal da equipe de vendas para alinhar metas e estratégias',
      start_date: new Date(Date.now() + 86400000).toISOString(),
      end_date: new Date(Date.now() + 86400000 + 3600000).toISOString(),
      all_day: false,
      company_id,
      created_by: req.user!.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    res.json(mockEvent);
  } catch (error) {
    logger.error('Get calendar event by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new calendar event
 */
export const createCalendarEvent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { title, description, start_date, end_date, all_day }: CreateCalendarEventRequest = req.body;
    const company_id = req.user!.company_id;
    const created_by = req.user!.id;

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (startDate >= endDate) {
      res.status(400).json({ message: 'End date must be after start date' });
      return;
    }

    // In a real implementation, this would create the event in the database
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title,
      description,
      start_date,
      end_date,
      all_day: all_day || false,
      company_id,
      created_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    logger.info(`Calendar event created: ${newEvent.id} for company ${company_id}`);
    res.status(201).json(newEvent);
  } catch (error) {
    logger.error('Create calendar event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update a calendar event
 */
export const updateCalendarEvent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, start_date, end_date, all_day }: UpdateCalendarEventRequest = req.body;
    const company_id = req.user!.company_id;

    // Validate dates if provided
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      if (startDate >= endDate) {
        res.status(400).json({ message: 'End date must be after start date' });
        return;
      }
    }

    // In a real implementation, this would update the event in the database
    const updatedEvent: CalendarEvent = {
      id,
      title: title || 'Evento Atualizado',
      description: description || 'Descrição atualizada',
      start_date: start_date || new Date().toISOString(),
      end_date: end_date || new Date(Date.now() + 3600000).toISOString(),
      all_day: all_day !== undefined ? all_day : false,
      company_id,
      created_by: req.user!.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    logger.info(`Calendar event updated: ${id}`);
    res.json(updatedEvent);
  } catch (error) {
    logger.error('Update calendar event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a calendar event
 */
export const deleteCalendarEvent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const company_id = req.user!.company_id;

    // In a real implementation, this would verify ownership and delete from database
    
    logger.info(`Calendar event deleted: ${id}`);
    res.status(204).send();
  } catch (error) {
    logger.error('Delete calendar event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};