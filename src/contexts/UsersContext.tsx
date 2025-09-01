import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, CreateUserData, MOCK_USERS } from "@/types/users";
import { useAuth } from "@/contexts/auth";

interface UsersContextType {
  users: User[];
  currentUser: User | null;
  isAdmin: boolean;
  createUser: (userData: CreateUserData) => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateUserPermissions: (userId: string, permissions: Record<string, boolean>) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
}

const UsersContext = createContext<UsersContextType | null>(null);

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error("useUsers must be used within a UsersProvider");
  }
  return context;
};

export const UsersProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  
  const isAdmin = profile?.email === "elisabete.silva@viainfra.com.br";
  const currentUser = users.find(user => user.email === profile?.email) || null;

  // Load users from localStorage or initialize with mock data
  useEffect(() => {
    const savedUsers = localStorage.getItem('system-users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      setUsers(MOCK_USERS);
      localStorage.setItem('system-users', JSON.stringify(MOCK_USERS));
    }
  }, []);

  // Save users to localStorage whenever users change
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('system-users', JSON.stringify(users));
    }
  }, [users]);

  const createUser = async (userData: CreateUserData): Promise<void> => {
    if (!isAdmin) throw new Error("Only admins can create users");
    
    // Check if email already exists
    if (users.find(user => user.email === userData.email)) {
      throw new Error("E-mail já está em uso");
    }

    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      role: userData.role,
      isActive: true,
      createdAt: new Date().toISOString(),
      permissions: userData.permissions || {}
    };

    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
    if (!isAdmin) throw new Error("Only admins can update users");
    
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, ...userData } : user
    ));
  };

  const deleteUser = async (userId: string): Promise<void> => {
    if (!isAdmin) throw new Error("Only admins can delete users");
    
    // Don't allow deleting the current admin
    const userToDelete = users.find(user => user.id === userId);
    if (userToDelete?.email === profile?.email) {
      throw new Error("Você não pode deletar sua própria conta");
    }

    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  const updateUserPermissions = async (userId: string, permissions: Record<string, boolean>): Promise<void> => {
    if (!isAdmin) throw new Error("Only admins can update permissions");
    
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, permissions } : user
    ));
  };

  const toggleUserStatus = async (userId: string): Promise<void> => {
    if (!isAdmin) throw new Error("Only admins can toggle user status");
    
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    ));
  };

  const value: UsersContextType = {
    users,
    currentUser,
    isAdmin,
    createUser,
    updateUser,
    deleteUser,
    updateUserPermissions,
    toggleUserStatus
  };

  return (
    <UsersContext.Provider value={value}>
      {children}
    </UsersContext.Provider>
  );
};