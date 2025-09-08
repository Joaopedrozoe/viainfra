import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Department } from '@/types/departments';
import { useAuth } from '@/contexts/auth';
import { MOCK_DEPARTMENTS } from '@/data/mockDepartments';

interface DepartmentsContextType {
  departments: Department[];
  createDepartment: (department: { name: string; description: string; members?: string[] }) => void;
  updateDepartment: (id: string, updates: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  addMemberToDepartment: (departmentId: string, userId: string) => void;
  removeMemberFromDepartment: (departmentId: string, userId: string) => void;
  getUserDepartments: (userId: string) => Department[];
  getDepartmentByUser: (userId: string) => Department | null;
  canViewAllDepartments: boolean;
  getFilteredDepartments: (userId?: string) => Department[];
}

const DepartmentsContext = createContext<DepartmentsContextType | null>(null);

export const useDepartments = () => {
  const context = useContext(DepartmentsContext);
  if (!context) {
    throw new Error("useDepartments must be used within a DepartmentsProvider");
  }
  return context;
};

export const DepartmentsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const { profile } = useAuth();
  
  const isAdmin = profile?.role === 'admin';
  const canViewAllDepartments = isAdmin;

  // Initialize departments from localStorage or mock data
  useEffect(() => {
    const storedDepartments = localStorage.getItem('departments');
    if (storedDepartments) {
      setDepartments(JSON.parse(storedDepartments));
    } else {
      setDepartments(MOCK_DEPARTMENTS);
      localStorage.setItem('departments', JSON.stringify(MOCK_DEPARTMENTS));
    }
  }, []);

  // Save to localStorage whenever departments change
  useEffect(() => {
    if (departments.length > 0) {
      localStorage.setItem('departments', JSON.stringify(departments));
    }
  }, [departments]);

  const createDepartment = (departmentData: { name: string; description: string; members?: string[] }) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem criar departamentos');
    }

    const newDepartment: Department = {
      id: `dept-${Date.now()}`,
      name: departmentData.name,
      description: departmentData.description,
      members: departmentData.members || [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setDepartments(prev => [...prev, newDepartment]);
  };

  const updateDepartment = (id: string, updates: Partial<Department>) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem editar departamentos');
    }

    setDepartments(prev => 
      prev.map(dept => 
        dept.id === id 
          ? { ...dept, ...updates }
          : dept
      )
    );
  };

  const deleteDepartment = (id: string) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem deletar departamentos');
    }

    setDepartments(prev => prev.filter(dept => dept.id !== id));
  };

  const addMemberToDepartment = (departmentId: string, userId: string) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem adicionar membros');
    }

    setDepartments(prev => 
      prev.map(dept => 
        dept.id === departmentId 
          ? { 
              ...dept, 
              members: [...new Set([...dept.members, userId])]
            }
          : dept
      )
    );
  };

  const removeMemberFromDepartment = (departmentId: string, userId: string) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem remover membros');
    }

    setDepartments(prev => 
      prev.map(dept => 
        dept.id === departmentId 
          ? { 
              ...dept, 
              members: dept.members.filter(memberId => memberId !== userId)
            }
          : dept
      )
    );
  };

  const getUserDepartments = (userId: string): Department[] => {
    return departments.filter(dept => dept.members.includes(userId));
  };

  const getDepartmentByUser = (userId: string): Department | null => {
    return departments.find(dept => dept.members.includes(userId)) || null;
  };

  const getFilteredDepartments = (userId?: string): Department[] => {
    if (canViewAllDepartments) {
      return departments;
    }
    
    if (userId) {
      return getUserDepartments(userId);
    }
    
    return [];
  };

  const value: DepartmentsContextType = {
    departments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    addMemberToDepartment,
    removeMemberFromDepartment,
    getUserDepartments,
    getDepartmentByUser,
    canViewAllDepartments,
    getFilteredDepartments,
  };

  return (
    <DepartmentsContext.Provider value={value}>
      {children}
    </DepartmentsContext.Provider>
  );
};