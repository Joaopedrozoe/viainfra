import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Permission, DEFAULT_PERMISSIONS } from '@/types/permissions';
import { useAuth } from '@/contexts/auth';

interface PermissionsContextType {
  userPermissions: Record<string, boolean>;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  updatePermissions: (userId: string, permissions: Record<string, boolean>) => void;
  getAllPermissions: () => Permission[];
}

const PermissionsContext = createContext<PermissionsContextType | null>(null);

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
};

export const PermissionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const { user, profile } = useAuth();
  
  // Check if user is admin based on email or role
  const isAdmin = profile?.role === 'admin' || user?.email === 'admin@sistema.com';

  useEffect(() => {
    if (user) {
      // Load permissions from localStorage or set defaults
      const storedPermissions = localStorage.getItem(`permissions_${user.id}`);
      if (storedPermissions) {
        setUserPermissions(JSON.parse(storedPermissions));
      } else {
        // Set default permissions based on admin status
        const defaultPerms: Record<string, boolean> = {};
        const allPermissions = getAllPermissions();
        
        allPermissions.forEach(permission => {
          if (isAdmin) {
            defaultPerms[permission.id] = true;
          } else {
            defaultPerms[permission.id] = permission.enabled && !permission.adminOnly;
          }
        });
        
        setUserPermissions(defaultPerms);
        localStorage.setItem(`permissions_${user.id}`, JSON.stringify(defaultPerms));
      }
    }
  }, [user, isAdmin]);

  const getAllPermissions = (): Permission[] => {
    return DEFAULT_PERMISSIONS.flatMap(category => category.permissions);
  };

  const hasPermission = (permission: string): boolean => {
    // Admins have all permissions
    if (isAdmin) return true;
    
    // Check if user has specific permission
    return userPermissions[permission] || false;
  };

  const updatePermissions = (userId: string, permissions: Record<string, boolean>) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem atualizar permissões');
    }
    
    // Save permissions to localStorage
    localStorage.setItem(`permissions_${userId}`, JSON.stringify(permissions));
    
    // Update current user's permissions if it's the same user
    if (user?.id === userId) {
      setUserPermissions(permissions);
    }
  };

  const value: PermissionsContextType = {
    userPermissions,
    hasPermission,
    isAdmin,
    updatePermissions,
    getAllPermissions,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};