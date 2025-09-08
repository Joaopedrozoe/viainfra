import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { AuthContextType, User, Profile, Company } from './types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
        const data = await apiClient.getProfile();
        setUser(data.user);
        setProfile(data.profile);
        setCompany(data.company);
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      // Remove invalid token
      localStorage.removeItem('auth_token');
      apiClient.removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await apiClient.signIn(email, password);
      
      apiClient.setToken(data.token);
      setUser(data.user);
      setProfile(data.profile);
      setCompany(data.company);
      
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Erro ao fazer login');
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const data = await apiClient.signUp(email, password, name);
      
      toast.success('Conta criada com sucesso! Por favor, faça login.');
      
      return data;
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'Erro ao criar conta');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await apiClient.signOut();
      setUser(null);
      setProfile(null);
      setCompany(null);
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    profile,
    company,
    isLoading,
    signIn,
    signUp,
    signOut,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};