
import { DbProfile, DbCompany } from '@/types/supabase';

export const attendantsProfiles: DbProfile[] = [
  {
    id: "demo-user-1",
    name: "Joicy Souza",
    email: "joicy.souza@vialogistic.com.br",
    company_id: "demo-company-456",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "demo-user-2",
    name: "Elisabete Silva",
    email: "elisabete.silva@viainfra.com.br",
    company_id: "demo-company-456",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "demo-user-3",
    name: "Suelem Souza",
    email: "suelem.souza@vialogistic.com.br",
    company_id: "demo-company-456",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "demo-user-4",
    name: "Giovanna Ferreira",
    email: "giovanna.ferreira@vialogistic.com.br",
    company_id: "demo-company-456",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "demo-user-5",
    name: "Sandra Romano",
    email: "sandra.romano@vialogistic.com.br",
    company_id: "demo-company-456",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const mockProfile: DbProfile = attendantsProfiles[0];

export const mockCompany: DbCompany = {
  id: "demo-company-456",
  name: "ViaInfra",
  is_demo: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};
