import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/users';
import { useAuth } from '@/contexts/auth';
import { MOCK_USERS } from '@/data/mockUsers';

interface UsersContextType {
  users: User[];
  currentUser: User | null;
  isAdmin: boolean;
  createUser: (user: Omit<User, 'id' | 'created_at' | 'updated_at'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  updateUserPermissions: (id: string, permissions: string[]) => void;
  toggleUserStatus: (id: string) => void;
  toggleUserRole: (id: string) => void;
}

const UsersContext = createContext<UsersContextType | null>(null);

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error("useUsers must be used within a UsersProvider");
  }
  return context;
};

export const UsersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const { user: authUser, profile } = useAuth();
  
  const isAdmin = profile?.role === 'admin';
  const currentUser = users.find(u => u.id === authUser?.id) || null;

  // Initialize users from localStorage or mock data
  useEffect(() => {
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      setUsers(MOCK_USERS);
      localStorage.setItem('users', JSON.stringify(MOCK_USERS));
    }
  }, []);

  // Save to localStorage whenever users change
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('users', JSON.stringify(users));
    }
  }, [users]);

  const createUser = (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem criar usuários');
    }

    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    if (!isAdmin && id !== authUser?.id) {
      throw new Error('Você só pode editar seu próprio perfil');
    }

    setUsers(prev => 
      prev.map(user => 
        user.id === id 
          ? { ...user, ...updates, updated_at: new Date().toISOString() }
          : user
      )
    );
  };

  const deleteUser = (id: string) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem deletar usuários');
    }

    if (id === authUser?.id) {
      throw new Error('Você não pode deletar sua própria conta');
    }

    setUsers(prev => prev.filter(user => user.id !== id));
  };

  const updateUserPermissions = (id: string, permissions: string[]) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem atualizar permissões');
    }

    setUsers(prev => 
      prev.map(user => 
        user.id === id 
          ? { ...user, permissions, updated_at: new Date().toISOString() }
          : user
      )
    );
  };

  const toggleUserStatus = (id: string) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem alterar status de usuários');
    }

    setUsers(prev => 
      prev.map(user => 
        user.id === id 
          ? { 
              ...user, 
              status: user.status === 'active' ? 'inactive' : 'active',
              updated_at: new Date().toISOString()
            }
          : user
      )
    );
  };

  const toggleUserRole = (id: string) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem alterar roles de usuários');
    }

    setUsers(prev => 
      prev.map(user => 
        user.id === id 
          ? { 
              ...user, 
              role: user.role === 'admin' ? 'user' : 'admin',
              updated_at: new Date().toISOString()
            }
          : user
      )
    );
  };

  const value: UsersContextType = {
    users,
    currentUser,
    isAdmin,
    createUser,
    updateUser,
    deleteUser,
    updateUserPermissions,
    toggleUserStatus,
    toggleUserRole
  };

  return (
    <UsersContext.Provider value={value}>
      {children}
    </UsersContext.Provider>
  );
};