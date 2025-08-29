import { useState, useEffect, createContext, ReactNode, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthContextType } from "./types";
import { fetchUserProfile } from "./useProfileData";
import { authOperations } from "./authOperations";
import { DemoAuthProvider, useDemoAuth } from "./DemoAuthContext";
import { useDemoMode } from "@/hooks/useDemoMode";

// Create the auth context
const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Real auth provider component
const RealAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state
  const initializeAuth = async () => {
    try {
      // Get the current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        console.info("Auth state changed: INITIAL_SESSION", currentSession.user.email);
        setSession(currentSession);
        setUser(currentSession.user);
        setIsAuthenticated(true);
        
        // Fetch user profile data
        const { profile: userProfile, company: userCompany } = await fetchUserProfile(currentSession.user.id);
        setProfile(userProfile);
        setCompany(userCompany);
      }
    } catch (error) {
      console.error("Error initializing auth state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initialize auth state
    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (event === "SIGNED_IN" && newSession) {
          console.info("Auth state changed: SIGNED_IN", newSession.user.email);
          setSession(newSession);
          setUser(newSession.user);
          setIsAuthenticated(true);
          
          // Fetch user profile data
          const { profile: userProfile, company: userCompany } = await fetchUserProfile(newSession.user.id);
          setProfile(userProfile);
          setCompany(userCompany);
        } else if (event === "SIGNED_OUT") {
          console.info("Auth state changed: SIGNED_OUT");
          setSession(null);
          setUser(null);
          setProfile(null);
          setCompany(null);
          setIsAuthenticated(false);
        }
      }
    );

    // Cleanup the subscription
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Authentication methods
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await authOperations.signIn(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      await authOperations.signUp(email, password, name);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await authOperations.signOut();
    } finally {
      setIsLoading(false);
    }
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Main auth provider that chooses between demo and real auth
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { isDemoMode } = useDemoMode();

  if (isDemoMode) {
    return (
      <DemoAuthProvider>
        <DemoAuthWrapper>{children}</DemoAuthWrapper>
      </DemoAuthProvider>
    );
  }

  return (
    <RealAuthProvider>
      {children}
    </RealAuthProvider>
  );
};

// Wrapper to use demo auth in demo mode
const DemoAuthWrapper = ({ children }: { children: ReactNode }) => {
  const demoAuth = useDemoAuth();
  
  return (
    <AuthContext.Provider value={demoAuth}>
      {children}
    </AuthContext.Provider>
  );
};
