import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  created_at: string;
  updated_at: string;
}

export const useWhatsAppInstances = () => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInstances = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstances(data || []);
    } catch (error: any) {
      console.error('Error loading WhatsApp instances:', error);
      toast.error('Erro ao carregar instâncias do WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstances();

    // Subscribe to real-time changes
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

  const createInstance = async (instanceName: string) => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/evolution-instance/create`,
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
      if (!response.ok) throw new Error(data.message || 'Failed to create instance');
      
      toast.success('Instância criada com sucesso!');
      await loadInstances();
      return data;
    } catch (error: any) {
      console.error('Error creating instance:', error);
      toast.error('Erro ao criar instância');
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

  const forceFixWebhook = async (instanceName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('evolution-instance', {
        body: { action: 'force-fix', instanceName }
      });

      if (error) throw error;

      toast.success('Webhook reconfigurado! Aguarde 30s e teste.');
      await loadInstances();
      return data;
    } catch (error: any) {
      console.error('Erro ao forçar fix do webhook:', error);
      toast.error('Erro ao reconfigurar webhook: ' + error.message);
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

  return {
    instances,
    loading,
    createInstance,
    getInstanceStatus,
    getInstanceQR,
    deleteInstance,
    sendMessage,
    syncInstances,
    forceFixWebhook,
    refresh: loadInstances
  };
};
