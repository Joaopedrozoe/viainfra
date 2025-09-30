import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, CreateUserData } from '@/types/users';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';

interface UsersContextType {
  users: User[];
  currentUser: User | null;
  isAdmin: boolean;
  createUser: (user: CreateUserData) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateUserPermissions: (id: string, permissions: Record<string, boolean>) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<void>;
  toggleUserRole: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
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
  const currentUser = users.find(u => u.email === authUser?.email) || null;

  // Fetch users from Supabase
  const fetchUsers = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedUsers: User[] = (data || []).map(p => {
        const permissions: Record<string, boolean> = {};
        if (Array.isArray(p.permissions)) {
          p.permissions.forEach((perm: string) => {
            permissions[perm] = true;
          });
        }

        return {
          id: p.id,
          name: p.name,
          email: p.email,
          role: p.role as 'admin' | 'attendant',
          isActive: true, // Add a column to profiles if needed
          createdAt: p.created_at,
          lastLogin: p.updated_at, // Use updated_at as proxy for last login
          permissions,
        };
      });

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [profile?.company_id]);

  const createUser = async (userData: CreateUserData) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem criar usuários');
    }

    try {
      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create profile
        const permissions = userData.permissions ? Object.keys(userData.permissions).filter(k => userData.permissions![k]) : [];
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            company_id: profile?.company_id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            permissions,
          });

        if (profileError) throw profileError;

        await fetchUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    if (!isAdmin && id !== currentUser?.id) {
      throw new Error('Você só pode editar seu próprio perfil');
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          email: updates.email,
          role: updates.role,
          permissions: updates.permissions ? Object.keys(updates.permissions).filter(k => updates.permissions![k]) : undefined,
        })
        .eq('id', id);

      if (error) throw error;

      await fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem deletar usuários');
    }

    if (id === currentUser?.id) {
      throw new Error('Você não pode deletar sua própria conta');
    }

    try {
      // Get user_id from profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', id)
        .single();

      if (profileData) {
        // Delete auth user (will cascade to profile due to FK)
        const { error } = await supabase.auth.admin.deleteUser(profileData.user_id);
        
        if (error) throw error;

        await fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const updateUserPermissions = async (id: string, permissions: Record<string, boolean>) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem atualizar permissões');
    }

    try {
      const permissionsArray = Object.keys(permissions).filter(k => permissions[k]);
      
      const { error } = await supabase
        .from('profiles')
        .update({ permissions: permissionsArray })
        .eq('id', id);

      if (error) throw error;

      await fetchUsers();
    } catch (error) {
      console.error('Error updating permissions:', error);
      throw error;
    }
  };

  const toggleUserStatus = async (id: string) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem alterar status de usuários');
    }

    const user = users.find(u => u.id === id);
    if (!user) return;

    // Note: You'll need to add an 'is_active' column to profiles table
    // For now, this is a placeholder
    console.log('Toggle status for user:', id);
    await fetchUsers();
  };

  const toggleUserRole = async (id: string) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem alterar funções');
    }

    const user = users.find(u => u.id === id);
    if (!user) return;

    const newRole = user.role === 'admin' ? 'user' : 'admin';

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', id);

      if (error) throw error;

      await fetchUsers();
    } catch (error) {
      console.error('Error toggling role:', error);
      throw error;
    }
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
    toggleUserRole,
    refetch: fetchUsers,
  };

  return (
    <UsersContext.Provider value={value}>
      {children}
    </UsersContext.Provider>
  );
};
