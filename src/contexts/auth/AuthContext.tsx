import React, { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType, User, Profile, Company, AccessibleCompany } from './types';

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
  const [accessibleCompanies, setAccessibleCompanies] = useState<AccessibleCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Aplicar tema baseado na empresa
  useEffect(() => {
    if (company?.name?.toUpperCase() === 'VIALOGISTIC') {
      document.body.setAttribute('data-theme', 'vialogistic');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [company]);

  const loadAccessibleCompanies = async (userId: string, profileCompanies: AccessibleCompany[]) => {
    try {
      // Query company_access for additional companies
      const { data: accessData, error } = await supabase
        .from('company_access')
        .select('company_id')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ [AuthContext] Error fetching company_access:', error);
        setAccessibleCompanies(profileCompanies);
        return;
      }

      if (!accessData || accessData.length === 0) {
        setAccessibleCompanies(profileCompanies);
        return;
      }

      // Get company details for the additional companies
      const additionalCompanyIds = (accessData as any[])
        .map((a: any) => a.company_id)
        .filter((id: string) => !profileCompanies.some(pc => pc.id === id));

      if (additionalCompanyIds.length === 0) {
        setAccessibleCompanies(profileCompanies);
        return;
      }

      // Fetch company details using service-level access (companies table has RLS)
      // We need to fetch from companies table - user has access via profiles RLS
      // But for company_access companies, user may not have a profile yet
      // Use a separate query with the company IDs
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, logo_url')
        .in('id', additionalCompanyIds);

      if (companiesError) {
        console.error('❌ [AuthContext] Error fetching additional companies:', companiesError);
        // Companies RLS might block this - try edge function instead
        // For now, create entries with just the ID
        const fallbackCompanies = additionalCompanyIds.map((id: string) => ({
          id,
          name: 'Empresa',
          logo_url: undefined,
        }));
        setAccessibleCompanies([...profileCompanies, ...fallbackCompanies]);
        return;
      }

      const allCompanies = [
        ...profileCompanies,
        ...(companiesData || []).map(c => ({
          id: c.id,
          name: c.name,
          logo_url: c.logo_url || undefined,
        })),
      ];

      console.log('🔐 [AuthContext] Accessible companies:', allCompanies.map(c => c.name));
      setAccessibleCompanies(allCompanies);
    } catch (error) {
      console.error('❌ [AuthContext] Failed to load accessible companies:', error);
      setAccessibleCompanies(profileCompanies);
    }
  };

  const buildProfileData = (profileData: any): Profile => ({
    ...profileData,
    role: profileData.role as 'admin' | 'user' | 'manager',
    permissions: (profileData.permissions as any) || [],
    companies: profileData.companies ? {
      ...profileData.companies,
      plan: profileData.companies.plan as 'free' | 'pro' | 'enterprise',
      settings: (profileData.companies.settings as any) || {},
    } : undefined,
  });

  const initializeAuth = async (preserveCompany = false) => {
    try {
      console.log('🔐 [AuthContext] Initializing auth...', { preserveCompany });
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: allProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*, companies(*)')
          .eq('user_id', session.user.id);

        if (profilesError) {
          console.error('❌ [AuthContext] Error fetching profiles:', profilesError);
          toast.error('Erro ao carregar perfil do usuário');
          return;
        }

        if (allProfiles && allProfiles.length > 0) {
          const sortedProfiles = [...allProfiles].sort((a, b) => {
            const aName = a.companies?.name?.toUpperCase();
            const bName = b.companies?.name?.toUpperCase();
            if (aName === 'VIAINFRA') return -1;
            if (bName === 'VIAINFRA') return 1;
            return 0;
          });
          
          // If preserving company selection, keep current profile/company
      const savedCompanyId = sessionStorage.getItem('active_company_id');
          const activeCompanyId = savedCompanyId;
          
          // Check if the active company is an external one (no local profile)
          const hasLocalProfileForActive = activeCompanyId 
            ? sortedProfiles.some(p => p.company_id === activeCompanyId) 
            : false;

          // If the active company is external (set via switchCompanyWithProfile),
          // do NOT overwrite profile/company - just update userProfiles and user basics
          // This must work regardless of preserveCompany flag (SIGNED_IN also fires on tab switch)
          if (activeCompanyId && !hasLocalProfileForActive) {
            console.log('🔐 [AuthContext] External company active:', activeCompanyId);
            
            const mappedProfiles = sortedProfiles.map(p => buildProfileData(p));
            setUserProfiles(mappedProfiles);

            // Update user basics
            setUser(prev => prev ? { ...prev, id: session.user.id, email: session.user.email! } : {
              id: session.user.id,
              email: session.user.email!,
              name: sortedProfiles[0].name,
              created_at: session.user.created_at,
              updated_at: sortedProfiles[0].updated_at,
            });

            // CRITICAL: If profile/company are null (page refresh), restore from sessionStorage cache
            const cachedData = sessionStorage.getItem(`external_profile_${activeCompanyId}`);
            if (cachedData) {
              try {
                const { profile: cachedProfile, company: cachedCompany } = JSON.parse(cachedData);
                if (cachedProfile && cachedCompany) {
                  console.log('🔐 [AuthContext] Restoring external company from cache:', cachedCompany.name);
                  setProfile(cachedProfile);
                  setCompany(cachedCompany);
                }
              } catch (e) {
                console.error('❌ [AuthContext] Failed to parse cached external profile:', e);
                // Cache corrupted - clear and fall back to default
                sessionStorage.removeItem('active_company_id');
                sessionStorage.removeItem(`external_profile_${activeCompanyId}`);
                // Re-run with default company
                const defaultProfile = sortedProfiles[0];
                if (defaultProfile.companies) {
                  setProfile(buildProfileData(defaultProfile));
                  setCompany({
                    ...defaultProfile.companies,
                    plan: defaultProfile.companies.plan as 'free' | 'pro' | 'enterprise',
                    settings: (defaultProfile.companies.settings as any) || {},
                  });
                }
              }
            } else {
              // No cache available - can't restore external company, fall back to default
              console.warn('⚠️ [AuthContext] No cached data for external company, falling back to default');
              sessionStorage.removeItem('active_company_id');
              const defaultProfile = sortedProfiles[0];
              if (defaultProfile.companies) {
                setProfile(buildProfileData(defaultProfile));
                setCompany({
                  ...defaultProfile.companies,
                  plan: defaultProfile.companies.plan as 'free' | 'pro' | 'enterprise',
                  settings: (defaultProfile.companies.settings as any) || {},
                });
              }
            }

            // Load accessible companies
            const profileCompanies: AccessibleCompany[] = sortedProfiles
              .filter(p => p.companies)
              .map(p => ({
                id: p.company_id,
                name: p.companies!.name,
                logo_url: p.companies!.logo_url || undefined,
              }));
            await loadAccessibleCompanies(session.user.id, profileCompanies);
            console.log('✅ [AuthContext] Auth re-initialized (external company handled)');
          } else {
            // Normal flow: pick the right local profile
            let profileData = sortedProfiles[0];
            if (activeCompanyId) {
              const savedProfile = sortedProfiles.find(p => p.company_id === activeCompanyId);
              if (savedProfile) {
                profileData = savedProfile;
                console.log('🔐 [AuthContext] Restoring saved company:', activeCompanyId);
              }
            }
            
            if (!profileData.companies) {
              console.error('❌ [AuthContext] Profile has no company data:', profileData);
              toast.error('Perfil sem empresa associada');
              return;
            }

            const mappedProfiles = sortedProfiles.map(p => buildProfileData(p));
            setUserProfiles(mappedProfiles);

            setUser({
              id: session.user.id,
              email: session.user.email!,
              name: profileData.name,
              created_at: session.user.created_at,
              updated_at: profileData.updated_at,
            });
            
            const newProfile = buildProfileData(profileData);
            setProfile(newProfile);
            setCompany({
              ...profileData.companies,
              plan: profileData.companies.plan as 'free' | 'pro' | 'enterprise',
              settings: (profileData.companies.settings as any) || {},
            });

            // Load accessible companies (from profiles + company_access)
            const profileCompanies: AccessibleCompany[] = sortedProfiles
              .filter(p => p.companies)
              .map(p => ({
                id: p.company_id,
                name: p.companies!.name,
                logo_url: p.companies!.logo_url || undefined,
              }));

            await loadAccessibleCompanies(session.user.id, profileCompanies);

            console.log('✅ [AuthContext] Auth initialized successfully');
          }
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
    }
  };

  // Use ref to always call the latest initializeAuth from auth state change listener
  const initializeAuthRef = useRef(initializeAuth);
  useEffect(() => {
    initializeAuthRef.current = initializeAuth;
  }, [initializeAuth]);

  useEffect(() => {
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setCompany(null);
        setUserProfiles([]);
        setAccessibleCompanies([]);
        sessionStorage.removeItem('active_company_id');
      } else if (event === 'SIGNED_IN' && session) {
        // Always use latest initializeAuth via ref to avoid stale closures
        initializeAuthRef.current();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('🔐 [AuthContext] Token refreshed, preserving company selection');
        initializeAuthRef.current(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        const { data: allProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*, companies(*)')
          .eq('user_id', data.user.id);

        if (profilesError) throw profilesError;

        if (allProfiles && allProfiles.length > 0) {
          const sortedProfiles = [...allProfiles].sort((a, b) => {
            const aName = a.companies?.name?.toUpperCase();
            const bName = b.companies?.name?.toUpperCase();
            if (aName === 'VIAINFRA') return -1;
            if (bName === 'VIAINFRA') return 1;
            return 0;
          });
          
          const profileData = sortedProfiles[0];
          if (!profileData.companies) throw new Error('Profile without company');
          
          const mappedProfiles = sortedProfiles.map(p => buildProfileData(p));
          setUserProfiles(mappedProfiles);
          
          setUser({
            id: data.user.id,
            email: data.user.email!,
            name: profileData.name,
            created_at: data.user.created_at,
            updated_at: profileData.updated_at,
          });
          
          setProfile(buildProfileData(profileData));
          setCompany({
            ...profileData.companies,
            plan: profileData.companies.plan as 'free' | 'pro' | 'enterprise',
            settings: (profileData.companies.settings as any) || {},
          });

          // Load accessible companies
          const profileCompanies: AccessibleCompany[] = sortedProfiles
            .filter(p => p.companies)
            .map(p => ({
              id: p.company_id,
              name: p.companies!.name,
              logo_url: p.companies!.logo_url || undefined,
            }));

          await loadAccessibleCompanies(data.user.id, profileCompanies);
          
          toast.success(`Bem-vindo(a), ${profileData.name}!`);
        } else {
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
        email, password,
        options: { data: { name } }
      });
      if (error) throw error;

      if (data.user) {
        const { data: companyData } = await supabase
          .from('companies')
          .insert({ name: 'Minha Empresa', plan: 'free' })
          .select()
          .single();

        if (companyData) {
          await supabase.from('profiles').insert({
            user_id: data.user.id,
            company_id: companyData.id,
            name, email,
            role: 'admin',
            permissions: ['all'],
          });
        }
      }
      
      toast.success('Conta criada com sucesso! Por favor, faça login.');
      return { user: data.user, error: null };
    } catch (error: any) {
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
      setAccessibleCompanies([]);
      // Clear all company-related session data
      sessionStorage.removeItem('active_company_id');
      sessionStorage.removeItem('verified_companies');
      // Clear cached external profiles
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('external_profile_')) {
          sessionStorage.removeItem(key);
        }
      });
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const switchCompany = async (companyId: string) => {
    try {
      // First check if there's a local profile for this company
      const selectedProfile = userProfiles.find(p => p.company_id === companyId);
      
      if (selectedProfile) {
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
          sessionStorage.setItem('active_company_id', companyId);
          toast.success(`Alternado para ${companyData.name}`);
        }
      }
      // If no local profile, the CompanySwitcher will handle auth modal
      // and call switchCompanyWithProfile after successful verification
    } catch (error) {
      console.error('Error switching company:', error);
      toast.error('Erro ao trocar de empresa');
    }
  };

  const switchCompanyWithProfile = (companyId: string, externalProfile: Profile, companyData: Company) => {
    setProfile(externalProfile);
    setCompany(companyData);
    sessionStorage.setItem('active_company_id', companyId);
    toast.success(`Alternado para ${companyData.name}`);
  };

  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    profile,
    company,
    isLoading,
    userProfiles,
    accessibleCompanies,
    switchCompany,
    switchCompanyWithProfile,
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
