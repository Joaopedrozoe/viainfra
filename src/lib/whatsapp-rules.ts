/**
 * REGRA MESTRA: Instâncias WhatsApp - POR EMPRESA
 * 
 * Cada empresa só pode utilizar instâncias que contenham seu prefixo no nome:
 * - VIAINFRA: Apenas instâncias com "VIAINFRA" no nome
 * - VIALOGISTIC: Apenas instâncias com "VIALOGISTIC" no nome
 * 
 * Qualquer outra instância será IGNORADA pelo sistema como se não existisse.
 */

// IDs das empresas
export const COMPANY_IDS = {
  VIAINFRA: 'da17735c-5a76-4797-b338-f6e63a7b3f8b',
  VIALOGISTIC: 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0',
} as const;

// Prefixos obrigatórios por empresa
export const COMPANY_INSTANCE_PREFIXES: Record<string, string> = {
  [COMPANY_IDS.VIAINFRA]: 'VIAINFRA',
  [COMPANY_IDS.VIALOGISTIC]: 'VIALOGISTIC',
};

// Prefixo padrão (fallback) - usado quando empresa não está mapeada
export const DEFAULT_INSTANCE_PREFIX = 'VIAINFRA';

/**
 * Obtém o prefixo de instância obrigatório para uma empresa
 * @param companyId ID da empresa
 * @returns Prefixo obrigatório para a empresa
 */
export const getCompanyInstancePrefix = (companyId: string | null | undefined): string => {
  if (!companyId) return DEFAULT_INSTANCE_PREFIX;
  return COMPANY_INSTANCE_PREFIXES[companyId] || DEFAULT_INSTANCE_PREFIX;
};

/**
 * Verifica se uma instância é válida para uma empresa específica
 * @param instanceName Nome da instância
 * @param companyId ID da empresa (opcional - se não fornecido, usa prefixo padrão)
 * @returns true se a instância contém o prefixo correto para a empresa
 */
export const isValidWhatsAppInstance = (
  instanceName: string, 
  companyId?: string | null
): boolean => {
  if (!instanceName) return false;
  const prefix = getCompanyInstancePrefix(companyId);
  return instanceName.toUpperCase().includes(prefix);
};

/**
 * Filtra apenas instâncias válidas para uma empresa específica
 * @param instances Array de instâncias
 * @param companyId ID da empresa para filtrar
 * @returns Apenas instâncias que contêm o prefixo correto para a empresa
 */
export const filterValidInstances = <T extends { instance_name: string; company_id?: string | null }>(
  instances: T[],
  companyId?: string | null
): T[] => {
  return instances.filter(instance => {
    // Se companyId foi fornecido, usar ele para validar
    // Caso contrário, usar o company_id da própria instância
    const effectiveCompanyId = companyId || instance.company_id;
    return isValidWhatsAppInstance(instance.instance_name, effectiveCompanyId);
  });
};

/**
 * Retorna mensagem de erro para instância inválida
 * @param instanceName Nome da instância
 * @param companyId ID da empresa (opcional)
 * @returns Mensagem de erro formatada
 */
export const getInvalidInstanceMessage = (
  instanceName: string, 
  companyId?: string | null
): string => {
  const prefix = getCompanyInstancePrefix(companyId);
  return `Instância "${instanceName}" não permitida. Apenas instâncias com "${prefix}" no nome podem ser utilizadas.`;
};

/**
 * Obtém o nome da empresa pelo ID
 * @param companyId ID da empresa
 * @returns Nome da empresa ou 'Desconhecida'
 */
export const getCompanyName = (companyId: string | null | undefined): string => {
  if (!companyId) return 'Desconhecida';
  
  const entry = Object.entries(COMPANY_IDS).find(([, id]) => id === companyId);
  return entry ? entry[0] : 'Desconhecida';
};

// LEGACY EXPORTS - Para compatibilidade com código existente
// @deprecated Use getCompanyInstancePrefix(companyId) em vez disso
export const WHATSAPP_INSTANCE_PREFIX = DEFAULT_INSTANCE_PREFIX;
