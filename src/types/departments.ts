export interface Department {
  id: string;
  name: string;
  description: string;
  members: string[]; // user IDs
  isActive: boolean;
  createdAt: string;
}

export interface CreateDepartmentData {
  name: string;
  description: string;
  members?: string[];
}

// Departamentos existentes baseados no que já estava no construtor de bots
export const MOCK_DEPARTMENTS: Department[] = [
  {
    id: "atendimento",
    name: "Atendimento",
    description: "Departamento responsável pelo atendimento ao cliente",
    members: ["2"], // Joicy Souza
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "comercial",
    name: "Comercial",
    description: "Departamento responsável pelas vendas e negociações",
    members: ["1"], // Elisabete Silva (admin)
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "manutencao",
    name: "Manutenção",
    description: "Departamento responsável pela manutenção e suporte técnico",
    members: ["3"], // Suelem Souza
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "financeiro",
    name: "Financeiro",
    description: "Departamento responsável pelas finanças e contabilidade",
    members: ["4"], // Giovanna Ferreira
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "rh",
    name: "RH",
    description: "Departamento de Recursos Humanos",
    members: ["5"], // Sandra Romano
    isActive: true,
    createdAt: new Date().toISOString()
  }
];