
import { DbProfile, DbCompany } from '@/types/supabase';

export const mockProfile: DbProfile = {
  id: "demo-user-123",
  name: "João Pedro Silva",
  email: "joaopedro@zoesolucoes.com.br",
  company_id: "demo-company-456",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const mockCompany: DbCompany = {
  id: "demo-company-456",
  name: "ZOE Soluções Demo",
  is_demo: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};
