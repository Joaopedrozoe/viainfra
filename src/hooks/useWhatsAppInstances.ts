import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      const { data, error } = await supabase.functions.invoke('evolution-instance', {
        body: {
          action: 'create',
          instanceName
        }
      });

      if (error) throw error;
      
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
      const { data, error } = await supabase.functions.invoke('evolution-instance', {
        body: {
          action: 'status',
          instanceName
        }
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error getting instance status:', error);
      throw error;
    }
  };

  const getInstanceQR = async (instanceName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('evolution-instance', {
        body: {
          action: 'qr',
          instanceName
        }
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error getting QR code:', error);
      throw error;
    }
  };

  const deleteInstance = async (instanceName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('evolution-instance', {
        body: {
          action: 'delete',
          instanceName
        }
      });

      if (error) throw error;
      
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
      const { data, error } = await supabase.functions.invoke('evolution-instance', {
        body: {
          action: 'sendMessage',
          instanceName,
          number,
          text
        }
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
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
    refresh: loadInstances
  };
};
