import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*, companies(*)')
          .eq('user_id', session.user.id)
          .single();

        if (profileData) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: profileData.name,
            created_at: session.user.created_at,
            updated_at: profileData.updated_at,
          });
          
          setProfile({
            ...profileData,
            role: profileData.role as 'admin' | 'user' | 'manager',
            permissions: (profileData.permissions as any) || [],
          });
          setCompany({
            ...profileData.companies,
            plan: profileData.companies.plan as 'free' | 'pro' | 'enterprise',
            settings: (profileData.companies.settings as any) || {},
          });
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setCompany(null);
      } else if (event === 'SIGNED_IN' && session) {
        initializeAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*, companies(*)')
          .eq('user_id', data.user.id)
          .single();

        if (profileData) {
          setUser({
            id: data.user.id,
            email: data.user.email!,
            name: profileData.name,
            created_at: data.user.created_at,
            updated_at: profileData.updated_at,
          });
          
          setProfile({
            ...profileData,
            role: profileData.role as 'admin' | 'user' | 'manager',
            permissions: (profileData.permissions as any) || [],
          });
          setCompany({
            ...profileData.companies,
            plan: profileData.companies.plan as 'free' | 'pro' | 'enterprise',
            settings: (profileData.companies.settings as any) || {},
          });
          
          toast.success('Login realizado com sucesso!');
        }
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Erro ao fazer login');
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (error) throw error;

      // Criar empresa e perfil padrão
      if (data.user) {
        const { data: companyData } = await supabase
          .from('companies')
          .insert({ name: 'Minha Empresa', plan: 'free' })
          .select()
          .single();

        if (companyData) {
          await supabase
            .from('profiles')
            .insert({
              user_id: data.user.id,
              company_id: companyData.id,
              name,
              email,
              role: 'admin',
              permissions: ['all'],
            });
        }
      }
      
      toast.success('Conta criada com sucesso! Por favor, faça login.');
      
      return { user: data.user, error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'Erro ao criar conta');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
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