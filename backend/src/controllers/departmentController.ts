import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/middleware/auth';
import { 
  PaginationParams,
  PaginatedResponse,
  Department,
} from '@/types';
import prisma from '@/utils/database';
import logger from '@/utils/logger';

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
}

/**
 * Get all departments for the user's company
 */
export const getDepartments = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { page, limit, search, sort, order }: PaginationParams = req.query;
    const company_id = req.user!.company_id;

    // Since departments aren't in the Prisma schema yet, we'll create mock data
    // In a real implementation, you would add the departments table to the schema
    
    const mockDepartments: Department[] = [
      {
        id: '1',
        name: 'Vendas',
        description: 'Departamento responsável pelas vendas e relacionamento com clientes',
        company_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Suporte Técnico',
        description: 'Atendimento e suporte técnico aos clientes',
        company_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Financeiro',
        description: 'Gestão financeira e cobrança',
        company_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '4',
        name: 'Marketing',
        description: 'Marketing digital e campanhas',
        company_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Filter by search if provided
    let filteredDepartments = mockDepartments;
    if (search) {
      filteredDepartments = mockDepartments.filter(dept => 
        dept.name.toLowerCase().includes(search.toLowerCase()) ||
        (dept.description && dept.description.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Apply sorting
    if (sort) {
      filteredDepartments.sort((a, b) => {
        const aValue = (a as any)[sort];
        const bValue = (b as any)[sort];
        if (order === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    // Apply pagination
    const skip = (page! - 1) * limit!;
    const total = filteredDepartments.length;
    const paginatedDepartments = filteredDepartments.slice(skip, skip + limit!);

    const response: PaginatedResponse<Department> = {
      data: paginatedDepartments,
      total,
      page: page!,
      limit: limit!,
      totalPages: Math.ceil(total / limit!),
    };

    res.json(response);
  } catch (error) {
    logger.error('Get departments error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get a specific department by ID
 */
export const getDepartmentById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const company_id = req.user!.company_id;

    // Mock department data
    const mockDepartment: Department = {
      id,
      name: 'Vendas',
      description: 'Departamento responsável pelas vendas e relacionamento com clientes',
      company_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    res.json(mockDepartment);
  } catch (error) {
    logger.error('Get department by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new department
 */
export const createDepartment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, description }: CreateDepartmentRequest = req.body;
    const company_id = req.user!.company_id;

    // Only admins can create departments
    if (req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Only admins can create departments' });
      return;
    }

    // In a real implementation, this would create the department in the database
    const newDepartment: Department = {
      id: Date.now().toString(),
      name,
      description,
      company_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    logger.info(`Department created: ${newDepartment.id} for company ${company_id}`);
    res.status(201).json(newDepartment);
  } catch (error) {
    logger.error('Create department error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update a department
 */
export const updateDepartment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description }: UpdateDepartmentRequest = req.body;
    const company_id = req.user!.company_id;

    // Only admins can update departments
    if (req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Only admins can update departments' });
      return;
    }

    // In a real implementation, this would update the department in the database
    const updatedDepartment: Department = {
      id,
      name: name || 'Departamento Atualizado',
      description: description || 'Descrição atualizada',
      company_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    logger.info(`Department updated: ${id}`);
    res.json(updatedDepartment);
  } catch (error) {
    logger.error('Update department error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a department
 */
export const deleteDepartment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const company_id = req.user!.company_id;

    // Only admins can delete departments
    if (req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Only admins can delete departments' });
      return;
    }

    // In a real implementation, this would check for dependencies and delete from database
    
    logger.info(`Department deleted: ${id}`);
    res.status(204).send();
  } catch (error) {
    logger.error('Delete department error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};