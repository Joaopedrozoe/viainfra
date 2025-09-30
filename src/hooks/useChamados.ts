import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

export interface Chamado {
  id: string;
  company_id: string;
  conversation_id?: string;
  numero_chamado: string;
  google_sheet_id?: string;
  placa: string;
  corretiva: boolean;
  local: 'Canteiro' | 'Oficina';
  agendamento: string;
  descricao: string;
  status: 'aberto' | 'em_andamento' | 'concluido' | 'cancelado';
  metadata: any;
  created_at: string;
  updated_at: string;
}

export const useChamados = () => {
  const { company } = useAuth();
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchChamados = async () => {
    if (!company?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chamados')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setChamados((data || []).map(chamado => ({
        ...chamado,
        local: chamado.local as 'Canteiro' | 'Oficina',
        status: chamado.status as 'aberto' | 'em_andamento' | 'concluido' | 'cancelado',
      })));
    } catch (err) {
      console.error('Error fetching chamados:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChamados();

    // Real-time subscription
    if (company?.id) {
      const channel = supabase
        .channel('chamados-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chamados',
            filter: `company_id=eq.${company.id}`,
          },
          () => {
            fetchChamados();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [company?.id]);

  const updateChamadoStatus = async (
    chamadoId: string,
    status: 'aberto' | 'em_andamento' | 'concluido' | 'cancelado'
  ) => {
    try {
      const { error } = await supabase
        .from('chamados')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', chamadoId);

      if (error) throw error;

      await fetchChamados();
    } catch (err) {
      console.error('Error updating chamado status:', err);
      throw err;
    }
  };

  return {
    chamados,
    loading,
    error,
    refetch: fetchChamados,
    updateChamadoStatus,
  };
};
