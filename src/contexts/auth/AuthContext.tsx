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
  const [userProfiles, setUserProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Aplicar tema baseado na empresa
  useEffect(() => {
    if (company?.name?.toUpperCase() === 'VIALOGISTIC') {
      document.body.setAttribute('data-theme', 'vialogistic');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [company]);

  const initializeAuth = async () => {
    try {
      console.log('🔐 [AuthContext] Initializing auth...');

      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('🔐 [AuthContext] Session:', {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email
      });
      
      if (session?.user) {
        // Buscar todos os perfis do usuário
        const { data: allProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*, companies(*)')
          .eq('user_id', session.user.id);

        console.log('🔐 [AuthContext] Profiles query result:', {
          profilesCount: allProfiles?.length || 0,
          profiles: allProfiles,
          error: profilesError
        });

        if (profilesError) {
          console.error('❌ [AuthContext] Error fetching profiles:', profilesError);
          toast.error('Erro ao carregar perfil do usuário');
          return;
        }

        if (allProfiles && allProfiles.length > 0) {
          // Ordenar perfis: VIAINFRA primeiro, depois outros
          const sortedProfiles = [...allProfiles].sort((a, b) => {
            const aName = a.companies?.name?.toUpperCase();
            const bName = b.companies?.name?.toUpperCase();
            if (aName === 'VIAINFRA') return -1;
            if (bName === 'VIAINFRA') return 1;
            return 0;
          });
          
          // Usar o primeiro perfil (VIAINFRA) como padrão
          const profileData = sortedProfiles[0];
          
          if (!profileData.companies) {
            console.error('❌ [AuthContext] Profile has no company data:', profileData);
            toast.error('Perfil sem empresa associada');
            return;
          }

          setUserProfiles(sortedProfiles.map(p => ({
            ...p,
            role: p.role as 'admin' | 'user' | 'manager',
            permissions: (p.permissions as any) || [],
            companies: p.companies ? {
              ...p.companies,
              plan: p.companies.plan as 'free' | 'pro' | 'enterprise',
              settings: (p.companies.settings as any) || {},
            } : undefined,
          })));

          console.log('🔐 [AuthContext] Setting user data...');

          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: profileData.name,
            created_at: session.user.created_at,
            updated_at: profileData.updated_at,
          });
          
          const newProfile: Profile = {
            ...profileData,
            role: profileData.role as 'admin' | 'user' | 'manager',
            permissions: (profileData.permissions as any) || [],
            companies: profileData.companies ? {
              ...profileData.companies,
              plan: profileData.companies.plan as 'free' | 'pro' | 'enterprise',
              settings: (profileData.companies.settings as any) || {},
            } : undefined,
          };
          
          console.log('🔐 [AuthContext] Profile set successfully:', {
            id: newProfile.id,
            name: newProfile.name,
            email: newProfile.email,
            role: newProfile.role,
            companyName: profileData.companies?.name
          });
          
          setProfile(newProfile);
          setCompany({
            ...profileData.companies,
            plan: profileData.companies.plan as 'free' | 'pro' | 'enterprise',
            settings: (profileData.companies.settings as any) || {},
          });

          console.log('✅ [AuthContext] Auth initialized successfully');
        } else {
          console.error('❌ [AuthContext] No profiles found for user:', session.user.id);
          toast.error('Nenhum perfil encontrado. Entre em contato com o suporte.');
        }
      } else {
        console.log('🔐 [AuthContext] No session found');
      }
    } catch (error) {
      console.error('❌ [AuthContext] Failed to initialize auth:', error);
      toast.error('Erro ao inicializar autenticação');
    } finally {
      setIsLoading(false);
      console.log('🔐 [AuthContext] Auth initialization complete. isLoading:', false);
    }
  };

  useEffect(() => {
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setCompany(null);
        setUserProfiles([]);
      } else if (event === 'SIGNED_IN' && session) {
        initializeAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 [AuthContext] Attempting sign in for:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ [AuthContext] Sign in error:', error);
        throw error;
      }

      console.log('✅ [AuthContext] Auth sign in successful, fetching profiles...');

      if (data.user) {
        // Buscar todos os perfis do usuário
        const { data: allProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*, companies(*)')
          .eq('user_id', data.user.id);

        console.log('🔐 [AuthContext] Profiles fetch result:', {
          profilesCount: allProfiles?.length || 0,
          profiles: allProfiles,
          error: profilesError
        });

        if (profilesError) {
          console.error('❌ [AuthContext] Error fetching profiles:', profilesError);
          toast.error('Erro ao carregar perfil');
          throw profilesError;
        }

        if (allProfiles && allProfiles.length > 0) {
          // Ordenar perfis: VIAINFRA primeiro, depois outros
          const sortedProfiles = [...allProfiles].sort((a, b) => {
            const aName = a.companies?.name?.toUpperCase();
            const bName = b.companies?.name?.toUpperCase();
            if (aName === 'VIAINFRA') return -1;
            if (bName === 'VIAINFRA') return 1;
            return 0;
          });
          
          // Usar o primeiro perfil (VIAINFRA) como padrão
          const profileData = sortedProfiles[0];

          if (!profileData.companies) {
            console.error('❌ [AuthContext] Profile has no company:', profileData);
            toast.error('Perfil sem empresa associada');
            throw new Error('Profile without company');
          }
          
          // Armazenar todos os perfis ordenados
          setUserProfiles(sortedProfiles.map(p => ({
            ...p,
            role: p.role as 'admin' | 'user' | 'manager',
            permissions: (p.permissions as any) || [],
            companies: p.companies ? {
              ...p.companies,
              plan: p.companies.plan as 'free' | 'pro' | 'enterprise',
              settings: (p.companies.settings as any) || {},
            } : undefined,
          })));
          
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
            companies: profileData.companies ? {
              ...profileData.companies,
              plan: profileData.companies.plan as 'free' | 'pro' | 'enterprise',
              settings: (profileData.companies.settings as any) || {},
            } : undefined,
          });
          
          setCompany({
            ...profileData.companies,
            plan: profileData.companies.plan as 'free' | 'pro' | 'enterprise',
            settings: (profileData.companies.settings as any) || {},
          });
          
          console.log('✅ [AuthContext] Login successful for:', {
            userName: profileData.name,
            companyName: profileData.companies.name,
            totalProfiles: allProfiles.length
          });
          
          toast.success(`Bem-vindo(a), ${profileData.name}!`);
        } else {
          console.error('❌ [AuthContext] No profiles found for user');
          toast.error('Nenhum perfil encontrado');
          throw new Error('No profiles found');
        }
      }
    } catch (error: any) {
      console.error('❌ [AuthContext] Sign in failed:', error);
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
      setUserProfiles([]);
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const switchCompany = async (companyId: string) => {
    try {
      const selectedProfile = userProfiles.find(p => p.company_id === companyId);
      
      if (!selectedProfile) {
        toast.error('Perfil não encontrado');
        return;
      }

      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyData) {
        setProfile(selectedProfile);
        setCompany({
          ...companyData,
          plan: companyData.plan as 'free' | 'pro' | 'enterprise',
          settings: (companyData.settings as any) || {},
        });
        toast.success(`Alternado para ${companyData.name}`);
      }
    } catch (error) {
      console.error('Error switching company:', error);
      toast.error('Erro ao trocar de empresa');
    }
  };

  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    profile,
    company,
    isLoading,
    userProfiles,
    switchCompany,
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