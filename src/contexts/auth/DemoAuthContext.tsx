
import { useState, useEffect, createContext, ReactNode, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { AuthContextType } from "./types";
import { mockProfile, mockCompany } from "./mockData";

// Create the demo auth context
const DemoAuthContext = createContext<AuthContextType | null>(null);

export const useDemoAuth = () => {
  const context = useContext(DemoAuthContext);
  if (!context) {
    throw new Error("useDemoAuth must be used within a DemoAuthProvider");
  }
  return context;
};

// Demo user data
const demoUser: User = {
  id: "demo-user-123",
  email: "joaopedro@zoesolucoes.com.br",
  user_metadata: {
    name: "João Pedro Silva"
  },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
  role: "authenticated"
} as User;

const demoSession: Session = {
  access_token: "demo-access-token",
  refresh_token: "demo-refresh-token",
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: "bearer",
  user: demoUser
} as Session;

export const DemoAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState(mockProfile);
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
      setIsAuthenticated(true);
    }
  }, []);

  // Authentication methods
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Demo credentials validation
      if (email === "joaopedro@zoesolucoes.com.br" && password === "eutenhenhoasenha") {
        setUser(demoUser);
        setSession(demoSession);
        setIsAuthenticated(true);
        
        // Save to localStorage
        localStorage.setItem('demo-auth', JSON.stringify({
          user: demoUser,
          session: demoSession
        }));
        
        toast.success('Login realizado com sucesso! (Modo Demo)');
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
      // In demo mode, any registration creates a demo account
      const newUser = { ...demoUser, email, user_metadata: { name } };
      const newSession = { ...demoSession, user: newUser };
      
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
