
import { Session, User } from '@supabase/supabase-js';
import { DbCompany, DbProfile } from '@/types/supabase';

export type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: DbProfile | null;
  company: DbCompany | null; 
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
};
