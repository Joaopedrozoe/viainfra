export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  company_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  role: 'admin' | 'user' | 'manager';
  permissions: string[];
  created_at: string;
  updated_at: string;
  companies?: Company;
}

export interface Company {
  id: string;
  name: string;
  domain?: string;
  plan: 'free' | 'pro' | 'enterprise';
  logo_url?: string;
  settings: {
    timezone?: string;
    language?: string;
    theme?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  company: Company | null;
  isLoading: boolean;
  userProfiles: Profile[];
  switchCompany: (companyId: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<any>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}