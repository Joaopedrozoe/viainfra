
import { useState, useEffect, createContext, ReactNode, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { AuthContextType } from "./types";
import { attendantsProfiles, mockCompany } from "./mockData";

// Create the demo auth context
const DemoAuthContext = createContext<AuthContextType | null>(null);

export const useDemoAuth = () => {
  const context = useContext(DemoAuthContext);
  if (!context) {
    throw new Error("useDemoAuth must be used within a DemoAuthProvider");
  }
  return context;
};

// ViaInfra attendant credentials
const attendantCredentials = [
  { email: "joicy.souza@vialogistic.com.br", password: "atendimento@25" },
  { email: "elisabete.silva@viainfra.com.br", password: "atendimento@25" },
  { email: "suelem.souza@vialogistic.com.br", password: "atendimento@25" },
  { email: "giovanna.ferreira@vialogistic.com.br", password: "atendimento@25" },
  { email: "sandra.romano@vialogistic.com.br", password: "atendimento@25" }
];

// Demo user data
const createDemoUser = (profile: any): User => ({
  id: profile.id,
  email: profile.email,
  user_metadata: {
    name: profile.name
  },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
  role: "authenticated"
} as User);

const createDemoSession = (user: User): Session => ({
  access_token: "demo-access-token",
  refresh_token: "demo-refresh-token",
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: "bearer",
  user
} as Session);

export const DemoAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState(attendantsProfiles[0]);
  const [company, setCompany] = useState(mockCompany);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing demo session on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('demo-auth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      setUser(authData.user);
      setSession(authData.session);
      if (authData.profile) {
        setProfile(authData.profile);
      }
      setIsAuthenticated(true);
    }
  }, []);

  // Authentication methods
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Find matching attendant credentials
      const attendantIndex = attendantCredentials.findIndex(
        cred => cred.email === email && cred.password === password
      );
      
      if (attendantIndex !== -1) {
        const attendantProfile = attendantsProfiles[attendantIndex];
        const demoUser = createDemoUser(attendantProfile);
        const demoSession = createDemoSession(demoUser);
        
        setUser(demoUser);
        setSession(demoSession);
        setProfile(attendantProfile);
        setIsAuthenticated(true);
        
        // Save to localStorage
        localStorage.setItem('demo-auth', JSON.stringify({
          user: demoUser,
          session: demoSession,
          profile: attendantProfile
        }));
        
        toast.success('Login realizado com sucesso!');
      } else {
        throw new Error('Credenciais inválidas');
      }
    } catch (error) {
      toast.error('Email ou senha incorretos');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // In demo mode, any registration creates a demo account using first attendant profile
      const firstProfile = attendantsProfiles[0];
      const newUser = createDemoUser({ ...firstProfile, email, name });
      const newSession = createDemoSession(newUser);
      
      setUser(newUser);
      setSession(newSession);
      setIsAuthenticated(true);
      
      // Save to localStorage
      localStorage.setItem('demo-auth', JSON.stringify({
        user: newUser,
        session: newSession
      }));
      
      toast.success('Conta criada com sucesso! (Modo Demo)');
    } catch (error) {
      toast.error('Erro ao criar conta no modo demo');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    setCompany(null);
    setIsAuthenticated(false);
    
    // Clear localStorage
    localStorage.removeItem('demo-auth');
    
    toast.success('Você saiu do sistema (Modo Demo)');
  };

  // Context value
  const value: AuthContextType = {
    session,
    user,
    profile,
    company,
    isLoading,
    signIn,
    signUp,
    signOut,
    isAuthenticated,
  };

  return <DemoAuthContext.Provider value={value}>{children}</DemoAuthContext.Provider>;
};
