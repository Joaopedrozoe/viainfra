/**
 * REGRA MESTRA: Instâncias WhatsApp - VIAINFRA
 * 
 * Apenas instâncias que contenham "VIAINFRA" no nome são:
 * - Visíveis na lista de canais
 * - Utilizáveis para envio/recebimento de mensagens
 * 
 * Qualquer outra instância será IGNORADA pelo sistema.
 */

export const WHATSAPP_INSTANCE_PREFIX = 'VIAINFRA';

/**
 * Verifica se uma instância é válida para uso no sistema
 * @param instanceName Nome da instância
 * @returns true se a instância contém "VIAINFRA" no nome
 */
export const isValidWhatsAppInstance = (instanceName: string): boolean => {
  if (!instanceName) return false;
  return instanceName.toUpperCase().includes(WHATSAPP_INSTANCE_PREFIX);
};

/**
 * Filtra apenas instâncias válidas de um array
 * @param instances Array de instâncias
 * @returns Apenas instâncias que contêm "VIAINFRA" no nome
 */
export const filterValidInstances = <T extends { instance_name: string }>(
  instances: T[]
): T[] => {
  return instances.filter(instance => isValidWhatsAppInstance(instance.instance_name));
};

/**
 * Retorna mensagem de erro para instância inválida
 */
export const getInvalidInstanceMessage = (instanceName: string): string => {
  return `Instância "${instanceName}" não permitida. Apenas instâncias com "${WHATSAPP_INSTANCE_PREFIX}" no nome podem ser utilizadas.`;
};
