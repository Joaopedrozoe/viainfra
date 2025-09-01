import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Department, CreateDepartmentData, MOCK_DEPARTMENTS } from "@/types/departments";
import { useAuth } from "@/contexts/auth";

interface DepartmentsContextType {
  departments: Department[];
  createDepartment: (departmentData: CreateDepartmentData) => Promise<void>;
  updateDepartment: (departmentId: string, departmentData: Partial<Department>) => Promise<void>;
  deleteDepartment: (departmentId: string) => Promise<void>;
  addMemberToDepartment: (departmentId: string, userId: string) => Promise<void>;
  removeMemberFromDepartment: (departmentId: string, userId: string) => Promise<void>;
  getUserDepartments: (userId: string) => Department[];
  getDepartmentByUser: (userId: string) => Department | null;
  canViewAllDepartments: (userId: string) => boolean;
  getFilteredDepartments: (userId: string) => Department[];
}

const DepartmentsContext = createContext<DepartmentsContextType | null>(null);

export const useDepartments = () => {
  const context = useContext(DepartmentsContext);
  if (!context) {
    throw new Error("useDepartments must be used within a DepartmentsProvider");
  }
  return context;
};

export const DepartmentsProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const isAdmin = profile?.email === "elisabete.silva@viainfra.com.br";

  // Load departments from localStorage or initialize with mock data
  useEffect(() => {
    // Force refresh with updated MOCK_DEPARTMENTS
    setDepartments(MOCK_DEPARTMENTS);
    localStorage.setItem('system-departments', JSON.stringify(MOCK_DEPARTMENTS));
  }, []);

  // Save departments to localStorage whenever departments change
  useEffect(() => {
    if (departments.length > 0) {
      localStorage.setItem('system-departments', JSON.stringify(departments));
    }
  }, [departments]);

  const createDepartment = async (departmentData: CreateDepartmentData): Promise<void> => {
    if (!isAdmin) throw new Error("Only admins can create departments");
    
    // Check if name already exists
    if (departments.find(dept => dept.name.toLowerCase() === departmentData.name.toLowerCase())) {
      throw new Error("Departamento já existe");
    }

    const newDepartment: Department = {
      id: Date.now().toString(),
      name: departmentData.name,
      description: departmentData.description,
      members: departmentData.members || [],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    setDepartments(prev => [...prev, newDepartment]);
  };

  const updateDepartment = async (departmentId: string, departmentData: Partial<Department>): Promise<void> => {
    if (!isAdmin) throw new Error("Only admins can update departments");
    
    setDepartments(prev => prev.map(dept => 
      dept.id === departmentId ? { ...dept, ...departmentData } : dept
    ));
  };

  const deleteDepartment = async (departmentId: string): Promise<void> => {
    if (!isAdmin) throw new Error("Only admins can delete departments");
    
    setDepartments(prev => prev.filter(dept => dept.id !== departmentId));
  };

  const addMemberToDepartment = async (departmentId: string, userId: string): Promise<void> => {
    if (!isAdmin) throw new Error("Only admins can manage department members");
    
    setDepartments(prev => prev.map(dept => 
      dept.id === departmentId 
        ? { ...dept, members: [...new Set([...dept.members, userId])] }
        : dept
    ));
  };

  const removeMemberFromDepartment = async (departmentId: string, userId: string): Promise<void> => {
    if (!isAdmin) throw new Error("Only admins can manage department members");
    
    setDepartments(prev => prev.map(dept => 
      dept.id === departmentId 
        ? { ...dept, members: dept.members.filter(id => id !== userId) }
        : dept
    ));
  };

  const getUserDepartments = (userId: string): Department[] => {
    return departments.filter(dept => dept.members.includes(userId));
  };

  const getDepartmentByUser = (userId: string): Department | null => {
    return departments.find(dept => dept.members.includes(userId)) || null;
  };

  const canViewAllDepartments = (userId: string): boolean => {
    // Check if user has permission to view all departments (stored in localStorage)
    const userSettings = localStorage.getItem(`user-settings-${userId}`);
    if (userSettings) {
      const settings = JSON.parse(userSettings);
      return settings.viewAllDepartments || false;
    }
    return false;
  };

  const getFilteredDepartments = (userId: string): Department[] => {
    if (isAdmin || canViewAllDepartments(userId)) {
      return departments;
    }
    return getUserDepartments(userId);
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
    getFilteredDepartments
  };

  return (
    <DepartmentsContext.Provider value={value}>
      {children}
    </DepartmentsContext.Provider>
  );
};