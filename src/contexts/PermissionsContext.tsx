import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Permission, UserPermissions, DEFAULT_PERMISSIONS } from "@/types/permissions";
import { useAuth } from "@/contexts/auth";

interface PermissionsContextType {
  userPermissions: UserPermissions | null;
  hasPermission: (permissionId: string) => boolean;
  isAdmin: boolean;
  updatePermissions: (permissions: Record<string, boolean>) => void;
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

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);

  // Check if user is admin (Elisabete)
  const isAdmin = profile?.email === "elisabete.silva@viainfra.com.br";

  // Load user permissions
  useEffect(() => {
    if (profile) {
      // Try to load from localStorage first
      const savedPermissions = localStorage.getItem(`permissions_${profile.email}`);
      
      if (savedPermissions) {
        setUserPermissions(JSON.parse(savedPermissions));
      } else {
        // Create default permissions for user
        const defaultUserPermissions: UserPermissions = {
          userId: profile.id,
          email: profile.email,
          isAdmin,
          permissions: {},
          lastUpdated: new Date().toISOString()
        };

        // Set default permissions based on user type
        const allPermissions = getAllPermissions();
        allPermissions.forEach(permission => {
          if (isAdmin) {
            // Admin has all permissions
            defaultUserPermissions.permissions[permission.id] = true;
          } else {
            // Regular user gets only enabled permissions that are not admin-only
            defaultUserPermissions.permissions[permission.id] = 
              permission.enabled && !permission.adminOnly;
          }
        });

        setUserPermissions(defaultUserPermissions);
        localStorage.setItem(`permissions_${profile.email}`, JSON.stringify(defaultUserPermissions));
      }
    }
  }, [profile, isAdmin]);

  const getAllPermissions = (): Permission[] => {
    return DEFAULT_PERMISSIONS.flatMap(category => category.permissions);
  };

  const hasPermission = (permissionId: string): boolean => {
    if (!userPermissions) return false;
    if (isAdmin) return true; // Admin always has all permissions
    return userPermissions.permissions[permissionId] || false;
  };

  const updatePermissions = (permissions: Record<string, boolean>) => {
    if (!userPermissions || !isAdmin) return; // Only admin can update permissions

    const updatedPermissions: UserPermissions = {
      ...userPermissions,
      permissions: { ...userPermissions.permissions, ...permissions },
      lastUpdated: new Date().toISOString()
    };

    setUserPermissions(updatedPermissions);
    localStorage.setItem(`permissions_${userPermissions.email}`, JSON.stringify(updatedPermissions));
  };

  const value: PermissionsContextType = {
    userPermissions,
    hasPermission,
    isAdmin,
    updatePermissions,
    getAllPermissions
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};