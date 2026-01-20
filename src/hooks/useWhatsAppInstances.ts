import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth/AuthContext';
import { 
  isValidWhatsAppInstance, 
  filterValidInstances, 
  getInvalidInstanceMessage,
  getCompanyInstancePrefix 
} from '@/lib/whatsapp-rules';

const SUPABASE_URL = 'https://xxojpfhnkxpbznbmhmua.supabase.co';

export interface WhatsAppInstance {
  id: string;
  company_id: string;
  instance_name: string;
  phone_number?: string;
  status: string;
  qr_code?: string;
  webhook_url?: string;
  connection_state?: string;
  last_sync?: string;
  bot_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiagnosticSummary {
  totalEvolution: number;
  totalDatabase: number;
  missingInDb: number;
  missingMessages: number;
  outdated: number;
  ok: number;
  groups: number;
  contacts: number;
}

export interface DiagnosticProblem {
  jid: string;
  name: string;
  isGroup: boolean;
  inEvolution: boolean;
  inDatabase: boolean;
  status: 'ok' | 'missing_in_db' | 'missing_messages' | 'outdated';
}

export const useWhatsAppInstances = () => {
  const { company } = useAuth();
  const companyId = company?.id || null;
  
  const [allInstances, setAllInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);

  // REGRA MESTRA POR EMPRESA: Cada empresa só vê instâncias com seu prefixo
  // VIAINFRA → instâncias com "VIAINFRA" no nome
  // VIALOGISTIC → instâncias com "VIALOGISTIC" no nome
  const instances = useMemo(() => {
    return filterValidInstances(allInstances, companyId);
  }, [allInstances, companyId]);
  
  // Prefixo obrigatório para a empresa atual
  const instancePrefix = useMemo(() => {
    return getCompanyInstancePrefix(companyId);
  }, [companyId]);

  const loadInstances = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllInstances(data || []);
    } catch (error: any) {
      console.error('Error loading WhatsApp instances:', error);
      toast.error('Erro ao carregar instâncias do WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstances();

    const channel = supabase
      .channel('whatsapp-instances-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances'
        },
        () => {
          loadInstances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createInstance = async (instanceName: string, channel: string = 'baileys') => {
    // REGRA MESTRA POR EMPRESA: Validar nome da instância antes de criar
    if (!isValidWhatsAppInstance(instanceName, companyId)) {
      const errorMsg = getInvalidInstanceMessage(instanceName, companyId);
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/evolution-instance/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ instanceName, channel })
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Failed to create instance');
      
      await loadInstances();
      return data;
    } catch (error: any) {
      console.error('Error creating instance:', error);
      throw error;
    }
  };

  const getInstanceStatus = async (instanceName: string) => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/evolution-instance/status?instance=${instanceName}`,
        {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error('Failed to get status');
      return data;
    } catch (error: any) {
      console.error('Error getting instance status:', error);
      throw error;
    }
  };

  const getInstanceQR = async (instanceName: string) => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/evolution-instance/qr?instance=${instanceName}`,
        {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error('Failed to get QR');
      return data;
    } catch (error: any) {
      console.error('Error getting QR code:', error);
      throw error;
    }
  };

  const deleteInstance = async (instanceName: string) => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/evolution-instance/delete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ instanceName })
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error('Failed to delete instance');
      
      toast.success('Instância deletada com sucesso!');
      await loadInstances();
      return data;
    } catch (error: any) {
      console.error('Error deleting instance:', error);
      toast.error('Erro ao deletar instância');
      throw error;
    }
  };

  const sendMessage = async (instanceName: string, number: string, text: string) => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/evolution-instance/send-message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ instanceName, phoneNumber: number, message: text })
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error('Failed to send message');
      return data;
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
      throw error;
    }
  };

  const syncInstances = async () => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/evolution-instance/sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error('Failed to sync instances');
      
      toast.success(`${data.count} instância(s) sincronizada(s) com sucesso!`);
      await loadInstances();
      return data;
    } catch (error: any) {
      console.error('Error syncing instances:', error);
      toast.error('Erro ao sincronizar instâncias');
      throw error;
    }
  };

  const toggleBot = async (instanceName: string, enabled: boolean) => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/evolution-instance/toggle-bot`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ instanceName, enabled })
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to toggle bot');
      
      toast.success(data.message || (enabled ? 'Bot ativado!' : 'Bot desativado!'));
      return data;
    } catch (error: any) {
      console.error('Error toggling bot:', error);
      toast.error('Erro ao alterar status do bot');
      throw error;
    }
  };

  const fetchChats = async (instanceName: string, forceFullSync: boolean = false) => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/import-chats`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ instanceName, forceFullSync })
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao importar conversas');
      }
      
      return {
        totalChats: data.stats?.totalConversations || 0,
        processedChats: (data.stats?.newConversations || 0) + (data.stats?.updatedConversations || 0),
        importedContacts: data.stats?.newContacts || 0,
        importedConversations: data.stats?.newConversations || 0,
        updatedConversations: data.stats?.updatedConversations || 0,
        importedMessages: data.stats?.newMessages || 0,
        groupsCount: data.stats?.groups || 0,
        stats: data.stats,
        message: data.message
      };
    } catch (error: any) {
      console.error('Error fetching chats:', error);
      throw error;
    }
  };

  const diagnoseInstance = async (instanceName: string): Promise<{
    success: boolean;
    instanceName: string;
    connectionState: string;
    summary: DiagnosticSummary;
    problems: DiagnosticProblem[];
  }> => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/diagnose-instance`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ instanceName })
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha no diagnóstico');
      }
      
      return data;
    } catch (error: any) {
      console.error('Error diagnosing instance:', error);
      throw error;
    }
  };

  const fixRemoteJid = async (companyId: string, instanceName?: string) => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/fix-remote-jid`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ companyId, instanceName })
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao corrigir remoteJid');
      }
      
      toast.success(`${data.stats?.fixed || 0} contatos corrigidos!`);
      return data;
    } catch (error: any) {
      console.error('Error fixing remoteJid:', error);
      throw error;
    }
  };

  const reprocessMedia = async (instanceName: string) => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/evolution-instance/reprocess-media`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ instanceName })
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao reprocessar mídias');
      }
      
      return {
        processed: data.processed || 0,
        updated: data.updated || 0,
        failed: data.failed || 0,
        message: data.message
      };
    } catch (error: any) {
      console.error('Error reprocessing media:', error);
      throw error;
    }
  };

  const forceSyncInbox = async () => {
    try {
      console.log('🔄 Iniciando sincronização forçada do inbox...');
      
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/force-sync-inbox`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha na sincronização');
      }
      
      console.log('✅ Sincronização concluída:', data);
      toast.success(`Sincronizado! ${data.stats?.messagesImported || 0} novas mensagens`);
      return data;
    } catch (error: any) {
      console.error('Error in force sync:', error);
      toast.error('Erro ao sincronizar inbox');
      throw error;
    }
  };

  /**
   * Full History Import - Batch-based backup-style restoration
   * Imports complete history from all conversations and contacts in chunks
   * to avoid timeout issues. Supports resume capability.
   */
  const fullHistoryImport = async (
    instanceName: string,
    onProgress?: (progress: BatchImportProgress) => void
  ): Promise<BatchImportProgress> => {
    let isComplete = false;
    let lastProgress: BatchImportProgress = {
      phase: 'starting',
      nextPhase: 'messages',
      completed: false,
      totalItems: 0,
      processedItems: 0,
      needsContinue: true,
    };

    try {
      console.log('📥 Iniciando importação em batch de histórico...');
      
      // Start or continue import
      while (!isComplete) {
        const action = lastProgress.phase === 'starting' ? 'start' : 'continue';
        
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/batch-history-import`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({ instanceName, action })
          }
        );

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Falha na importação');
        }

        lastProgress = {
          phase: data.phase,
          nextPhase: data.nextPhase,
          completed: data.completed,
          totalItems: data.totalItems || 0,
          processedItems: data.processedItems || 0,
          itemsProcessed: data.itemsProcessed || 0,
          summary: data.summary,
          needsContinue: data.needsContinue,
        };

        console.log(`📊 Progress: ${lastProgress.phase} - ${lastProgress.processedItems}/${lastProgress.totalItems}`);
        
        // Callback for UI update
        if (onProgress) {
          onProgress(lastProgress);
        }

        isComplete = data.completed || !data.needsContinue;
      }
      
      console.log('✅ Importação em batch concluída:', lastProgress);
      return lastProgress;
    } catch (error: any) {
      console.error('Error in batch history import:', error);
      throw error;
    }
  };

  /**
   * Get current import job status
   */
  const getImportStatus = async (instanceName: string): Promise<{ hasActiveJob: boolean; job: any | null }> => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/batch-history-import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ instanceName, action: 'status' })
        }
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting import status:', error);
      return { hasActiveJob: false, job: null };
    }
  };

  return {
    instances,
    loading,
    companyId,
    instancePrefix,
    createInstance,
    getInstanceStatus,
    getInstanceQR,
    deleteInstance,
    sendMessage,
    syncInstances,
    toggleBot,
    fetchChats,
    diagnoseInstance,
    fixRemoteJid,
    reprocessMedia,
    forceSyncInbox,
    fullHistoryImport,
    getImportStatus,
    refresh: loadInstances
  };
};

// Type for batch import progress
export interface BatchImportProgress {
  phase: string;
  nextPhase: string;
  completed: boolean;
  totalItems: number;
  processedItems: number;
  itemsProcessed?: number;
  summary?: Record<string, any>;
  needsContinue: boolean;
}
